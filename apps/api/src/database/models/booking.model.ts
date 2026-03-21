import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { User } from './user.model';
import { Vendor } from './vendor.model';

export class Booking extends Model {
  declare id: string;
  declare vendorId: string;
  declare clientUserId: string;
  declare startTime: Date;
  declare endTime: Date;
  declare status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Booking.init(
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
    clientUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'),
      defaultValue: 'PENDING',
    },
  },
  {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    timestamps: true,
  }
);

Booking.belongsTo(User, { foreignKey: 'clientUserId', as: 'client' });
Booking.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
