import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { Vendor } from './vendor.model';

export class CalendarAvailability extends Model {
  declare id: string;
  declare vendorId: string;
  declare blockedDate: Date;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CalendarAvailability.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    blockedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CalendarAvailability',
    tableName: 'calendar_availabilities',
    timestamps: true,
  }
);

CalendarAvailability.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
Vendor.hasMany(CalendarAvailability, { foreignKey: 'vendorId', as: 'availabilities' });
