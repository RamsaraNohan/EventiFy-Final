import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';
import { EventVendor } from './event.model';

export class Task extends Model {
  declare id: string;
  declare eventVendorId: string;
  declare title: string;
  declare description: string | null;
  declare status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  declare progress: number; // 0-100
  declare files: string[];
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Task.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eventVendorId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'),
      defaultValue: 'PENDING',
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    files: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Task', tableName: 'tasks', timestamps: true }
);

Task.belongsTo(EventVendor, { foreignKey: 'eventVendorId', as: 'eventVendor' });
EventVendor.hasMany(Task, { foreignKey: 'eventVendorId', as: 'tasks' });
