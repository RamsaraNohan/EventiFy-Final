import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { User } from './user.model';
import { Vendor } from './vendor.model';

export class Conversation extends Model {
  declare id: string;
  declare vendorId: string | null;
  declare clientUserId: string | null;
  declare adminUserId: string | null;
  declare lastMessageAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'vendors', key: 'id' },
    },
    clientUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    adminUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Conversation',
    tableName: 'conversations',
    timestamps: true,
  }
);

// Relationships
Conversation.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
Conversation.belongsTo(User, { foreignKey: 'clientUserId', as: 'client' });
Conversation.belongsTo(User, { foreignKey: 'adminUserId', as: 'admin' });


