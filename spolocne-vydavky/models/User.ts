import mongoose, { Schema } from 'mongoose'

const UserSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  avatarColor: { type: String, default: '#5B5EA6' },
}, { timestamps: true })

export const UserModel = mongoose.models.User ?? mongoose.model('User', UserSchema)
