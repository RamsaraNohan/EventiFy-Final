import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { User } from './user.model';

export class Vendor extends Model {
  declare id: string;
  declare ownerUserId: string;
  declare businessName: string;
  declare category: string;
  declare description: string;
  declare basePrice: number;
  declare city: string;
  declare approved: boolean;
  declare promotions: string | null;
  declare gallery: string[] | null;
  declare services: string[] | null;
  declare bankName: string | null;
  declare bankCode: string | null;
  declare branchCode: string | null;
  declare accountName: string | null;
  declare accountNumber: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Vendor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ownerUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    basePrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    promotions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gallery: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    services: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    bankName: { type: DataTypes.STRING, allowNull: true },
    bankCode: { type: DataTypes.STRING, allowNull: true },
    branchCode: { type: DataTypes.STRING, allowNull: true },
    accountName: { type: DataTypes.STRING, allowNull: true },
    accountNumber: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Vendor',
    tableName: 'vendors',
    timestamps: true,
  }
);

Vendor.belongsTo(User, { foreignKey: 'ownerUserId', as: 'owner' });
User.hasOne(Vendor, { foreignKey: 'ownerUserId', as: 'vendorProfile' });
