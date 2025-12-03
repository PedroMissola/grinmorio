const User = require('../models/User');
const { sendErrorResponse } = require('../utils/herrorHandler');

/**
 * Gets the ban status of a user.
 */
async function getUserStatus(req, res) {
  const { userId } = req.params;

  if (!userId) {
    return sendErrorResponse(res, 400, 'Bad Request', 'User ID is required.');
  }

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      // If user is not in DB, they are not banned
      return res.status(200).json({ userId, isBanned: false });
    }

    res.status(200).json({
      userId: user.userId,
      isBanned: user.isBanned,
      reason: user.banReason,
      bannedAt: user.bannedAt,
    });
  } catch (error) {
    console.error(`Error fetching status for user ${userId}:`, error);
    sendErrorResponse(res, 500, 'Internal Server Error', 'Could not retrieve user status.');
  }
}

/**
 * Bans a user.
 */
async function banUser(req, res) {
  const { userId, reason } = req.body;

  if (!userId) {
    return sendErrorResponse(res, 400, 'Bad Request', 'User ID is required.');
  }

  try {
    const banInfo = {
      isBanned: true,
      banReason: reason || 'Nenhum motivo especificado.',
      bannedAt: new Date(),
    };

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: banInfo },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: `Usuário ${userId} foi banido com sucesso.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error(`Error banning user ${userId}:`, error);
    sendErrorResponse(res, 500, 'Internal Server Error', 'Could not ban user.');
  }
}

/**
 * Unbans a user.
 */
async function unbanUser(req, res) {
  const { userId } = req.body;

  if (!userId) {
    return sendErrorResponse(res, 400, 'Bad Request', 'User ID is required.');
  }

  try {
    const user = await User.findOne({ userId });

    if (!user || !user.isBanned) {
      return sendErrorResponse(res, 404, 'Not Found', 'Usuário não encontrado ou não está banido.');
    }

    user.isBanned = false;
    user.banReason = null;
    user.bannedAt = null;
    await user.save();

    res.status(200).json({
      message: `Usuário ${userId} foi desbanido com sucesso.`,
      user,
    });
  } catch (error) {
    console.error(`Error unbanning user ${userId}:`, error);
    sendErrorResponse(res, 500, 'Internal Server Error', 'Could not unban user.');
  }
}

/**
 * Lists all banned users.
 */
async function listBannedUsers(req, res) {
  try {
    const bannedUsers = await User.find({ isBanned: true }).sort({ bannedAt: -1 });
    res.status(200).json(bannedUsers);
  } catch (error) {
    console.error('Error listing banned users:', error);
    sendErrorResponse(res, 500, 'Internal Server Error', 'Could not list banned users.');
  }
}

module.exports = {
  getUserStatus,
  banUser,
  unbanUser,
  listBannedUsers,
};
