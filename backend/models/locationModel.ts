import { prop, getModelForClass } from '@typegoose/typegoose';
import { ObjectId } from 'mongoose';

// Model Class for Items
class Location {
    @prop({ required: true })
    public user_id!: ObjectId;

    @prop({ type: () => [Object], _id: true, auto: true })
    public locations?: { _id: ObjectId, active: boolean, name: string; longitude: number, latitude: number, color: string }[]
}

export const LocationModel = getModelForClass(Location);