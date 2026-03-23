import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { User } from './user.model';

export class PasswordReset extends Model {
  declare id: string;
  declare userId: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare used: boolean;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PasswordReset.init(
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
    tokenHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'PasswordReset',
    tableName: 'password_resets',
    timestamps: true,
  }
);

PasswordReset.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(PasswordReset, { foreignKey: 'userId', as: 'passwordResets' });
