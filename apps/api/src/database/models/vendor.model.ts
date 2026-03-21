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
