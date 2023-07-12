import { prop, getModelForClass, modelOptions, Severity } from '@typegoose/typegoose';
import { ObjectId } from 'mongodb';

// Model Class for Items
class Item {
    @prop({ required: true })
    public name!: string;

    @prop({ required: true })
    public image_url!: string;

    @prop({ required: false })
    public quote?: string;

    @prop()
    public rarity?: string;

    @prop({ required: true, type: () => [String] })
    public category!: string[];

    @prop()
    public weight?: string;

    @prop()
    public required_level?: string;

    @prop()
    public crafting_time?: string;

    @prop()
    public crafted_in?: string;

    @prop({ type: () => [Object], _id: false })
    public ingredients?: { name: string; quantity: number }[]

    @prop({ type: () => [Object], _id: false })
    public user_inventory?: 
        {
            user_id: ObjectId, 
            total_quantity: number,
            locations: { _id: ObjectId; name: string; quantity: number;}[]
        }[]
}

export const ItemModel = getModelForClass(Item);