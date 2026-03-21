import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export class User extends Model {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
  declare role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  declare name: string;
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
      type: DataTypes.ENUM('CLIENT', 'VENDOR', 'ADMIN'),
      allowNull: false,
      defaultValue: 'CLIENT',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
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
