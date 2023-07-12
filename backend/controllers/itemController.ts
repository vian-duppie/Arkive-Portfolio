import { Request, Response } from 'express';
import { ItemModel } from '../models/itemModel';
import { UserModel } from '../models/userModel';
import { ObjectId } from 'mongodb';
import { LocationModel } from '../models/locationModel';
import { Types } from 'mongoose';

export const getSingleUserItem = async (itemId: ObjectId, userId: ObjectId) => {
    try {
        const item = await ItemModel.aggregate([
            {
                $match: {
                    _id: new ObjectId(itemId),
                },
            },
            {
                $addFields: { // Ads the below field to the matched document
                    user_inventory: {
                        $filter: {
                            input: "$user_inventory",
                            as: "inventory", // Variable for each element in the array that is being filtered
                            cond: {
                                $eq: ["$$inventory.user_id", new ObjectId(userId)],
                            },
                        },
                    },
                },
            },
        ]);
  
      const selectedItem = item[0];
      return selectedItem
    } catch (err) {
        console.log(err);
    }
}

export const getSingleItem = async (req: Request, res: Response) => {
    try {
        const item = await ItemModel.aggregate([
            {
                $match: {
                    _id: new ObjectId(req.params.itemId),
                },
            },
            {
                $addFields: { // Ads the below field to the matched document
                    user_inventory: {
                        $filter: {
                            input: "$user_inventory",
                            as: "inventory", // Variable for each element in the array that is being filtered
                            cond: {
                                $eq: ["$$inventory.user_id", new ObjectId(req.params.userId)],
                            },
                        },
                    },
                },
            },
        ]);
  
      const selectedItem = item[0];
      return res.json(selectedItem);
    } catch (err) {
        console.log(err);
    }
};

export const getUserItems = async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20
    const page = parseInt(req.query.page as string) || 1

    const totalDocCount = await ItemModel.countDocuments()

    const skipCount = (page - 1) * limit
    const limitCount = limit

    const items = await ItemModel.aggregate([
        {
            $addFields: {
                'user_inventory': {
                    $map: {
                        input: '$user_inventory',
                        as: 'inventory',
                        in: {
                            $mergeObjects: [
                                '$$inventory',
                                {
                                    total_quantity: {
                                        $reduce: {
                                            input: '$$inventory.locations.quantity',
                                            initialValue: 0,
                                            in: { $add: ['$$value', '$$this'] }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {$skip: skipCount},
        {$limit: limitCount}
    ])

    for (let i = 0; i < items.length; i++) {
        const updatedItem = items[i];
        await ItemModel.findByIdAndUpdate(updatedItem._id, updatedItem);
    }

    const myItems = await ItemModel.aggregate([
        {
            $project: {
                _id: 1,
                name: 1,
                image_url: 1,
                quote: 1,
                rarity: 1,
                category: 1,
                weight: 1,
                required_level: 1,
                crafting_time: 1,
                crafted_in: 1,
                user_inventory: {
                    $filter: {
                        input: '$user_inventory',
                        as: 'item',
                        cond: { $eq: ['$$item.user_id', new ObjectId(req.params.id)] },
                    },
                },
                ingredients: 1,
            },
        },
        {$skip: skipCount},
        {$limit: limitCount}
    ]);



    // Return the updated documents
    return res.json({myItems, totalDocCount});
}

export const searchUserItems = async (req: Request, res: Response) => {
    let { searchQuery } = req.params;

    // Validate searchQuery
    if (!searchQuery || typeof searchQuery !== 'string') {
        return res.status(400).send('Invalid search query');
    }

    // Sanitize searchQuery
    searchQuery = searchQuery.replace(/[^\w\s]/gi, '');

    const myItems = await ItemModel.aggregate([
        {
            // Match documents that have a name, rarity, weight, crafted_in, or ingredients that contain the search query
            $match: {
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { crafted_in: { $regex: searchQuery, $options: 'i' } },
                    { ingredients: { $regex: searchQuery, $options: 'i' } }
                ]
            }
        },
        {
            // Project the fields to include in the output
            $project: {
                _id: 1,
                name: 1,
                image_url: 1,
                quote: 1,
                rarity: 1,
                category: 1,
                weight: 1,
                required_level: 1,
                crafting_time: 1,
                crafted_in: 1,
                ingredients: 1,
                user_inventory: {
                    // Selects a subset of an array to return based on the specified condition
                    $filter: {
                        // Input selects the array
                        input: "$user_inventory",
                        // Define it as
                        as: "inventory",
                        // Conditon
                        cond: {
                            // Must be equal to
                            $eq: ["$$inventory.user_id", new ObjectId(req.params.id)]
                        }
                    }
                }
            }
        }
    ]);

    res.send(myItems);
}

export const updateItemLocationQuantity = async (req: Request, res: Response) => {
    const itemId = req.params.itemId;
    const locationId = req.params.locationId;
    const id = req.params.id;
    const amount = req.params.amount;
    try {
        const location = await LocationModel.findOne({ user_id: new ObjectId(req.params.id) });
        if (!location) {
            return res.status(404).json({ message: "Location not found" });
        }

        const locationObject = location.locations!.find((location) => location._id.toString() === req.params.locationId);

        const newLocationObject = {
            name: locationObject!.name,
            _id: new ObjectId(req.params.locationId),
            quantity: parseInt(req.params.amount)
        };

        const itemQuery = {
            _id: new ObjectId(req.params.itemId),
            "user_inventory.user_id": new ObjectId(req.params.id)
        };

        const update = {
            $set: {
                "user_inventory.$[outer].total_quantity": 1231
            },
            $push: {
                "user_inventory.$[outer].locations": newLocationObject
            }
        };

        const options = {
            new: true,
            arrayFilters: [
                { "outer.user_id": new ObjectId(req.params.id) }
            ]
        };

        let newItem = await ItemModel.findOneAndUpdate(itemQuery, update, options).exec();

        if (!newItem) {
            newItem = await ItemModel.findByIdAndUpdate(
                new ObjectId(req.params.itemId),
                {
                    $push: {
                        user_inventory: {
                            user_id: new ObjectId(req.params.id),
                            total_quantity: 1231,
                            locations: [newLocationObject]
                        },
                    },
                },
                { new: true }
            ).exec();
        }

        await newItem?.save();
        return res.send(newItem);

    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal server error');
    }
}

export const test = async (req: Request, res: Response) => {
    const { id, itemId, locationId, amount } = req.params

    /* Checks if the location exists */
    const location = await LocationModel.findOne(
        {
            user_id: new ObjectId(id)
        }
    )

    if (!location) {
        return res.status(404).json({message: "Location does not exist for user"})
    }

    /* Gets the location document */
    const locationObject = location.locations?.find((location) => location._id.toString() === req.params.locationId);

    if (!locationObject) {
        return res.json({ message: "There is no such location on the item" })
    }

    const newLocationObject = {
        name: locationObject.name,
        _id: new ObjectId(req.params.locationId),
        quantity: 0,
    };

    // Check if their is such a user location on Item Object
    const userObjectOnItem = await ItemModel.findOne({
        _id: new ObjectId(req.params.itemId),
        "user_inventory.user_id": new ObjectId(req.params.id)
    })

    if (!userObjectOnItem) {
        let UserInvObject = {
            user_id: new ObjectId(req.params.id),
            total_quantity: 0,
            locations: []
        }

        await ItemModel.findOneAndUpdate(
            {
                _id: new ObjectId(req.params.itemId),
            },
            {
                $push: {
                    "user_inventory": UserInvObject
                }
            },
            { new: true } // returns the updated document
        );

        /* Check if the locations exists on the Item Model */
        const locationOnItem = await ItemModel.findOne({
            _id: new ObjectId(req.params.itemId),
            "user_inventory.user_id": new ObjectId(req.params.id),
            "user_inventory.locations._id": new ObjectId(req.params.locationId)
        });

        if (!locationOnItem) {
            const addNewLocationObject = await ItemModel.findOneAndUpdate(
                {
                    _id: new ObjectId(req.params.itemId),
                    "user_inventory.user_id": new ObjectId(req.params.id)
                },
                {
                    $push: {
                        "user_inventory.$.locations": newLocationObject
                    }
                },
                { new: true } // returns the updated document
            );
            return res.json(addNewLocationObject);
        }

        await ItemModel.findOneAndUpdate(
            {
                _id: new ObjectId(req.params.itemId),
                "user_inventory.user_id": new ObjectId(req.params.id),
                "user_inventory.locations._id": new ObjectId(req.params.locationId),
            },
            {
                $inc: {
                    "user_inventory.$[i].locations.$[j].quantity": +Number(req.params.amount),
                },
            },
            {
                arrayFilters: [
                    { "i.user_id": new ObjectId(req.params.id) },
                    { "j._id": new ObjectId(req.params.locationId) },
                ],
                new: true,
            }
        );

        let updateDoc = await getSingleUserItem(new ObjectId(itemId), new ObjectId(id))
        return res.send(updateDoc)
    } else {
        /* Check if the locations exists on the Item Model */
        const locationOnItem = await ItemModel.findOne({
            _id: new ObjectId(req.params.itemId),
            "user_inventory.user_id": new ObjectId(req.params.id),
            "user_inventory.locations._id": new ObjectId(req.params.locationId)
        });

        if (!locationOnItem) {
            await ItemModel.findOneAndUpdate(
                {
                    _id: new ObjectId(req.params.itemId),
                    "user_inventory.user_id": new ObjectId(req.params.id)
                },
                {
                    $push: {
                        "user_inventory.$.locations": newLocationObject
                    }
                },
                { new: true } // returns the updated document
            );
        }

        let amountToAdd = Number(req.params.amount)

        await ItemModel.findOneAndUpdate(
            {
                _id: new ObjectId(req.params.itemId),
                "user_inventory.user_id": new ObjectId(req.params.id),
                "user_inventory.locations._id": new ObjectId(req.params.locationId),
            },
            {
                $inc: {
                    "user_inventory.$[i].locations.$[j].quantity": amountToAdd,
                },
            },
            {
                arrayFilters: [
                    { "i.user_id": new ObjectId(req.params.id) },
                    { "j._id": new ObjectId(req.params.locationId) },
                ]
            }
        );

        let updateDoc = await getSingleUserItem(new ObjectId(itemId), new ObjectId(id))
        console.log(updateDoc)
        return res.send(updateDoc)
    }
}