import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { User } from './user.model';
import { Vendor } from './vendor.model';

export type EventStatus =
  | 'PLANNING'
  | 'VENDORS_PENDING'
  | 'PAYMENT_PENDING'
  | 'ONGOING'
  | 'EVENT_SOON'
  | 'COMPLETED'
  | 'PAYMENT_REMAINING'
  | 'PAYMENT_OVERDUE';


export class Event extends Model {
  declare id: string;
  declare clientId: string;
  declare name: string;
  declare date: Date;
  declare location: string;
  declare budget: number;
  declare status: EventStatus;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Event.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    clientId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: true },
    budget: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM('PLANNING', 'VENDORS_PENDING', 'PAYMENT_PENDING', 'ONGOING', 'EVENT_SOON', 'COMPLETED', 'PAYMENT_OVERDUE'),
      defaultValue: 'PLANNING',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Event', tableName: 'events', timestamps: true }
);

// --- EventVendor Junction Model ---
export class EventVendor extends Model {
  declare id: string;
  declare eventId: string;
  declare vendorId: string;
  declare status: 'PENDING' | 'APPROVED' | 'ADVANCE_PAID' | 'COMPLETED' | 'FULLY_PAID';
  declare agreedCost: number | null;
  declare advancePaid: number | null;
  declare remainingAmount: number | null;
  declare conversationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventVendor.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eventId: { type: DataTypes.UUID, allowNull: false },
    vendorId: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'ADVANCE_PAID', 'COMPLETED', 'FULLY_PAID'),
      defaultValue: 'PENDING',
    },
    agreedCost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    advancePaid: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    remainingAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    conversationId: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, modelName: 'EventVendor', tableName: 'event_vendors', timestamps: true }
);

// Associations
Event.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
User.hasMany(Event, { foreignKey: 'clientId', as: 'events' });

Event.hasMany(EventVendor, { foreignKey: 'eventId', as: 'eventVendors' });
EventVendor.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

EventVendor.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
Vendor.hasMany(EventVendor, { foreignKey: 'vendorId', as: 'eventVendors' });
