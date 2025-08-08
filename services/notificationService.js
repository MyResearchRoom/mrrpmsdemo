const { Op } = require("sequelize");
const { Notification, Participant, User } = require("../models");
const {
  PROJECT_COORDINATOR,
  CLIENT,
  CLIENT_VENDOR,
  ADMIN,
} = require("../utils/constants");

exports.createNotifications = async (
  project,
  payload,
  senderId,
  senderRole,
  transaction
) => {
  const participants = await Participant.findAll({
    where: {
      projectId: project.id,
      ...(senderRole === PROJECT_COORDINATOR
        ? {
            employeeId: {
              [Op.ne]: senderId,
            },
          }
        : {}),
    },
  });

  if (senderRole !== CLIENT && senderRole !== CLIENT_VENDOR) {
    await Notification.create(
      {
        ...payload,
        clientId: project.clientId,
        userId: project.clientVendorId,
      },
      {
        transaction,
      }
    );
  }

  let notificationData = [];

  const admin = await User.findAll({
    attributes: ["id"],
    where: {
      role: ADMIN,
      ...(senderRole === ADMIN ? { id: { [Op.ne]: senderId } } : {}),
    },
  });

  for (let i = 0; i < admin.length; i++) {
    notificationData.push({
      ...payload,
      clientId: null,
      userId: admin[i].id,
    });
  }

  for (let i = 0; i < participants.length; i++) {
    notificationData.push({
      ...payload,
      clientId: null,
      userId: participants[i].employeeId,
    });
  }

  await Notification.bulkCreate(notificationData, {
    transaction,
  });

  return true;
};
