import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { User } from './user.model';
import { Vendor } from './vendor.model';

export class SavedVendor extends Model {
  declare id: string;
  declare userId: string;
  declare vendorId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SavedVendor.init(
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
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'SavedVendor',
    tableName: 'saved_vendors',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'vendorId'],
      },
    ],
  }
);

SavedVendor.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SavedVendor.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
User.hasMany(SavedVendor, { foreignKey: 'userId', as: 'savedVendors' });
Vendor.hasMany(SavedVendor, { foreignKey: 'vendorId', as: 'savedBy' });
