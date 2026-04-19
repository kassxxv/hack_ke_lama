import mongoose, { Schema, type Document } from 'mongoose'

const SplitSchema = new Schema({
  userId: String,
  amount: Number,
  settled: { type: Boolean, default: false },
}, { _id: false })

const ExpenseSchema = new Schema({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
  amount: Number,
  paidBy: String,
  splits: [SplitSchema],
  merchant: String,
  date: String,
  isPersonal: { type: Boolean, default: false },
  category: String,
}, { timestamps: true })

const MemberSchema = new Schema({
  userId: String,
  name: String,
  phone: String,
  avatarColor: String,
  role: { type: String, enum: ['admin', 'member', 'junior', 'parent', 'child'], default: 'member' },
  // joint-account groups only
  contributed: { type: Number, default: 0 },
}, { _id: false })

const ContributionSchema = new Schema({
  userId: String,
  amount: Number,
  note: { type: String, default: '' },
  date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
}, { _id: false })

const SubscriptionSchema = new Schema({
  name: { type: String, required: true },
  emoji: { type: String, default: '💳' },
  monthlyCost: { type: Number, default: 0 },
  username: { type: String, default: '' },
  password: { type: String, default: '' },
  paidBy: { type: String, default: '' },
  sharedWith: { type: [String], default: [] },
  nextBillingDate: { type: String, default: '' },
}, { timestamps: true })

const BudgetLimitSchema = new Schema({
  category: String,
  limitAmount: Number,
}, { _id: false })

const GroupSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['family', 'roommates', 'peers'], required: true },
  emoji: { type: String, default: '👥' },
  isTemporary: { type: Boolean, default: false },
  members: [MemberSchema],
  // joint-account groups only
  potBalance: { type: Number, default: 0 },
  potTarget: { type: Number, default: null },
  contributions: { type: [ContributionSchema], default: [] },
  subscriptions: { type: [SubscriptionSchema], default: [] },
  budgetLimits: { type: [BudgetLimitSchema], default: [] },
}, { timestamps: true })

if (mongoose.models.Group) mongoose.deleteModel('Group')
if (mongoose.models.Expense) mongoose.deleteModel('Expense')
mongoose.model('Group', GroupSchema)
mongoose.model('Expense', ExpenseSchema)

export const GroupModel = mongoose.models.Group
export const ExpenseModel = mongoose.models.Expense
