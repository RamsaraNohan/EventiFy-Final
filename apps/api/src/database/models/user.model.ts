import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export class User extends Model {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
  declare role: 'CLIENT' | 'VENDOR_OWNER' | 'ADMIN';
  declare name: string;
  declare avatarUrl: string | null;
  declare phone: string | null;
  declare bio: string | null;
  declare active: boolean;
  declare lastSeen: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('CLIENT', 'VENDOR_OWNER', 'ADMIN'),
      allowNull: false,
      defaultValue: 'CLIENT',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  }
);
