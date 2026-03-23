import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { User } from './user.model';

export class Notification extends Model {
  declare id: string;
  declare userId: string;
  declare type: 'BOOKING_REQUEST' | 'BOOKING_UPDATE' | 'NEW_MESSAGE' | 'SYSTEM'
    | 'NEW_BOOKING_REQUEST' | 'VENDOR_APPROVED' | 'NEW_TASK' | 'TASK_UPDATED' | 'PAYMENT_REQUIRED';
  declare title: string;
  declare body: string;
  declare href: string;
  declare readAt: Date | null;
  declare readonly createdAt: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'BOOKING_REQUEST', 'BOOKING_UPDATE', 'NEW_MESSAGE', 'SYSTEM',
        'NEW_BOOKING_REQUEST', 'VENDOR_APPROVED', 'NEW_TASK', 'TASK_UPDATED', 'PAYMENT_REQUIRED'
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    href: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    updatedAt: false, // only need createdAt
  }
);

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
