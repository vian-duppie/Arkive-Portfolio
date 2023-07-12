import { prop, getModelForClass } from '@typegoose/typegoose';
import { ObjectId } from 'mongoose';

// Model Class for Items
class User {
    @prop({ required: true })
    public name!: string;

    @prop({ required: true })
    public email!: string;

    @prop({ required: true })
    public password!: string;

    @prop({ required: true })
    public verification_code!: string;
}

export const UserModel = getModelForClass(User);