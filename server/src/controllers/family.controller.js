const pool = require('../config/db');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the FamilyGroup response shape matching the iOS FamilyGroup model.
 * Fetches members from family_members JOIN users.
 */
async function buildGroupResponse(groupRow) {
  const { rows: memberRows } = await pool.query(
    `SELECT
       fm.id, fm.role, fm.status, fm.is_safe,
       fm.last_latitude, fm.last_longitude, fm.last_updated, fm.device_token,
       u.name, u.phone
     FROM family_members fm
     JOIN users u ON u.id = fm.user_id
     WHERE fm.group_id = $1
     ORDER BY fm.joined_at ASC`,
    [groupRow.id]
  );

  return {
    id:            groupRow.id,
    name:          groupRow.name,
    invite_code:   groupRow.invite_code,
    admin_user_id: groupRow.admin_user_id,
    max_members:   groupRow.max_members,
    is_active:     groupRow.is_active,
    created_at:    groupRow.created_at,
    members:       memberRows.map(formatMember),
  };
}

function formatMember(row) {
  return {
    id:             row.id,
    name:           row.name,
    phone:          row.phone || null,
    role:           row.role,
    status:         row.status,
    is_safe:        row.is_safe,
    last_latitude:  row.last_latitude || null,
    last_longitude: row.last_longitude || null,
    last_updated:   row.last_updated || null,
    avatar_url:     null,
    device_token:   row.device_token || null,
  };
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── POST /api/family/group ────────────────────────────────────────────────────

async function createGroup(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required.' });
    }

    // Generate a unique invite code
    let inviteCode, codeExists = true;
    while (codeExists) {
      inviteCode = generateInviteCode();
      const check = await pool.query(
        'SELECT id FROM family_groups WHERE invite_code = $1', [inviteCode]
      );
      codeExists = check.rows.length > 0;
    }

    const { rows: groupRows } = await pool.query(
      `INSERT INTO family_groups (name, invite_code, admin_user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), inviteCode, req.user.id]
    );
    const group = groupRows[0];

    // Add creator as admin member
    await pool.query(
      `INSERT INTO family_members (group_id, user_id, role)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [group.id, req.user.id]
    );

    res.status(201).json(await buildGroupResponse(group));
  } catch (err) {
    next(err);
  }
}

// ── GET /api/family/group/:groupID ───────────────────────────────────────────

async function fetchGroup(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM family_groups WHERE id = $1 AND is_active = true',
      [req.params.groupID]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Family group not found.' });
    }
    res.json(await buildGroupResponse(rows[0]));
  } catch (err) {
    next(err);
  }
}

// ── GET /api/family/groups ───────────────────────────────────────────────────

async function fetchAllGroups(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT fg.* FROM family_groups fg
       JOIN family_members fm ON fm.group_id = fg.id
       WHERE fm.user_id = $1 AND fg.is_active = true
       ORDER BY fg.created_at DESC`,
      [req.user.id]
    );
    const groups = await Promise.all(rows.map(buildGroupResponse));
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

// ── POST /api/family/group/:groupID/invite ───────────────────────────────────

async function inviteMember(req, res, next) {
  try {
    const { groupID } = req.params;
    const { phone, email } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ success: false, error: 'phone or email is required.' });
    }

    // Verify group exists and requester is a member
    const groupCheck = await pool.query(
      'SELECT id, max_members FROM family_groups WHERE id = $1 AND is_active = true', [groupID]
    );
    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Family group not found.' });
    }

    // Check capacity
    const countRes = await pool.query(
      'SELECT COUNT(*) FROM family_members WHERE group_id = $1', [groupID]
    );
    const currentCount = parseInt(countRes.rows[0].count);
    if (currentCount >= groupCheck.rows[0].max_members) {
      return res.status(409).json({ success: false, error: 'Group is at max capacity.' });
    }

    // Find the user to invite by phone or email
    let targetUser = null;
    if (email) {
      const { rows } = await pool.query(
        'SELECT id, name, phone FROM users WHERE email = $1', [email.toLowerCase()]
      );
      if (rows.length > 0) targetUser = rows[0];
    }
    if (!targetUser && phone) {
      const { rows } = await pool.query(
        'SELECT id, name, phone FROM users WHERE phone = $1', [phone]
      );
      if (rows.length > 0) targetUser = rows[0];
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'No user found with that phone or email.' });
    }

    // Add to group
    const { rows: memberRows } = await pool.query(
      `INSERT INTO family_members (group_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (group_id, user_id) DO NOTHING
       RETURNING *`,
      [groupID, targetUser.id]
    );

    if (memberRows.length === 0) {
      return res.status(409).json({ success: false, error: 'User is already a member of this group.' });
    }

    res.status(201).json(formatMember({ ...memberRows[0], name: targetUser.name, phone: targetUser.phone }));
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/family/group/:groupID/member/:memberID ───────────────────────

async function removeMember(req, res, next) {
  try {
    const { groupID, memberID } = req.params;

    // Only group admin can remove members
    const adminCheck = await pool.query(
      `SELECT fm.id FROM family_members fm
       WHERE fm.group_id = $1 AND fm.user_id = $2 AND fm.role = 'admin'`,
      [groupID, req.user.id]
    );
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Only the group admin can remove members.' });
    }

    await pool.query(
      'DELETE FROM family_members WHERE id = $1 AND group_id = $2',
      [memberID, groupID]
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/family/group/:groupID/member/:memberID/status ───────────────────

async function updateMemberStatus(req, res, next) {
  try {
    const { groupID, memberID } = req.params;
    const { status } = req.body;

    const validStatuses = ['safe', 'need_help', 'evacuating', 'sos', 'unknown'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const isSafe = status === 'safe' ? true : status === 'need_help' || status === 'sos' ? false : null;

    const { rows } = await pool.query(
      `UPDATE family_members
       SET status = $1, is_safe = $2, last_updated = NOW()
       WHERE id = $3 AND group_id = $4
       RETURNING *`,
      [status, isSafe, memberID, groupID]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found in this group.' });
    }

    // Get user name/phone to complete the response
    const userRes = await pool.query('SELECT name, phone FROM users WHERE id = $1', [rows[0].user_id]);
    const user = userRes.rows[0] || {};

    res.json(formatMember({ ...rows[0], name: user.name, phone: user.phone }));
  } catch (err) {
    next(err);
  }
}

// ── POST /api/family/location ────────────────────────────────────────────────

async function shareLocation(req, res, next) {
  try {
    const { group_id, latitude, longitude } = req.body;

    if (!group_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'group_id, latitude, and longitude are required.' });
    }

    await pool.query(
      `UPDATE family_members
       SET last_latitude = $1, last_longitude = $2, last_updated = NOW()
       WHERE group_id = $3 AND user_id = $4`,
      [latitude, longitude, group_id, req.user.id]
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ── GET /api/family/group/:groupID/locations ─────────────────────────────────

async function fetchFamilyLocations(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT fm.id, fm.role, fm.status, fm.is_safe,
              fm.last_latitude, fm.last_longitude, fm.last_updated, fm.device_token,
              u.name, u.phone
       FROM family_members fm
       JOIN users u ON u.id = fm.user_id
       WHERE fm.group_id = $1
       ORDER BY fm.last_updated DESC NULLS LAST`,
      [req.params.groupID]
    );

    res.json(rows.map(formatMember));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createGroup,
  fetchGroup,
  fetchAllGroups,
  inviteMember,
  removeMember,
  updateMemberStatus,
  shareLocation,
  fetchFamilyLocations,
};
