import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { User } from './user.model';
import { Vendor } from './vendor.model';
import { Event } from './event.model';

export class Review extends Model {
  declare id: string;
  declare eventId: string;
  declare vendorId: string;
  declare clientId: string;
  declare rating: number; // 1-5
  declare comment: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Review.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eventId: { type: DataTypes.UUID, allowNull: false },
    vendorId: { type: DataTypes.UUID, allowNull: false },
    clientId: { type: DataTypes.UUID, allowNull: false },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Review', tableName: 'reviews', timestamps: true }
);

Review.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
Review.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
Review.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
Vendor.hasMany(Review, { foreignKey: 'vendorId', as: 'reviews' });
