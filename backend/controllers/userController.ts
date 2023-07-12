import { Request, Response } from 'express';
import { UserModel } from '../models/userModel';
import nodeMailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { v5 as uuidv5 } from 'uuid';
const crypto = require('crypto')
import 'dotenv'
import { ItemModel } from '../models/itemModel';
import { config } from 'dotenv';
import jwt, { JwtPayload, VerifyErrors, VerifyOptions } from 'jsonwebtoken';
import { LocationModel } from '../models/locationModel';
import { ObjectId } from 'mongodb';
config()

const generateKey = (email: string, password: string) => {
    /* Generate a random key from the users email and password */
    const hash = crypto
    .createHash('sha256')
    .update( 
        email + password 
    )
    .digest('hex')

    /* Hash the first generated key using the key and a random number between 1 and 1000 */
    const hashTwo = crypto
    .createHash('sha256')
    .update(
        hash + ( Math.floor(Math.random() * 1000) + 1 ) 
    )
    .digest('hex')
    
    const key = hashTwo.substring(0, 5)
    return key;
}

export const createUser = async (req: Request, res: Response) => {
    let isUnique = false;
    let key;

    // User Details from Front-End
    const { name, email, password } = req.body;

    // Hash the user password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Check if a user has previously signed up with this email
    const existingUser = await UserModel.findOne({email: email});

    // Just stop the backend all when email is taken and notify user
    if (existingUser){
        console.log("user taken")
        return res.json({status: false, error: 'email', message: "Email has already been used."})
    }

    while (!isUnique) {
        // Generate Key
        key = generateKey(email, password);
        console.log(key)
        
        // Find a user with key that matches the generated one
        const existingUser = await UserModel.findOne({verification_code: key})

        if (!existingUser) {
            isUnique = true;
            console.log("This key has not been previously used.")
        } 
    }

    let mailContent = `<div 
    style="
        text-align: center;
        width: 100%;
        max-width: 50%;
        background-color: #FFFFFF;
        margin: auto;
        border-radius: 50px;
        padding: 50px 10px;
        color: black;
    "
    >
    <div 
        style="
            margin: auto;
            gap: 30px;
            background-color: #F0F0F0;
            width: 100%;
            padding: 40px 20px;
            color: black;
        "
    >
        <p>${key}</p>
    </div>
    </div>`

    if (isUnique) {
        // Define the values for each key in the User Model
        const newUser = new UserModel(
            { 
                name: name,
                email: email, 
                password: hashedPassword, 
                verification_code: key 
            }
        );
        
        // Save the new user to the db.
        await newUser.save();

        const transporter = nodeMailer.createTransport({
            host: "mail.duppie-develops.co.za",
            port: 465,
            secure: true,
            auth: {
                user: "welcome@duppie-develops.co.za",
                pass: "dZ&#Mb{181qS"
            }
        });
    
        const mailInformation = {
            from: '"Arkive welcome" <welcome@duppie-develops.co.za>',
            to: email,
            subject: "Welcome! Let's verify!",
            html: mailContent
        }
    
        transporter.sendMail(mailInformation, (error, info) => {
            if (error) {
                return console.log(error)
            }
            console.log(`message sent `, info.messageId)
        })

        console.log("User has been successfully created.")
        return res.status(201).json({status: true, message: "User has been successfully created."})
    }
};

export const login = async ( req: Request, res: Response ) => {
    /* Data send from the client side */
    const code = req.body.verification_code;

    try {
        /* Find user where the code matches verification code */
        const user = await UserModel.findOne( 
            { verification_code: code } 
        )

        /* If user does not exist respond with status of false to indicate that the request was not authorized */
        if ( !user ) {
            return res.status(401).json(
                { status: false, message: "Make sure you entered the right code."}
            )
        }

        /* Create a JWT token for the user */
        const token = jwt.sign( 
            { code, userId: user._id},
            process.env.JWT_SECRET!
        )
        
        /* Respond with the new token created for the user and the userId */
        return res.json(
            { status: true, token, userId: user._id }
        )
    } catch {
        /* There was an error */
        return res.status( 500 ).json(
            { status: false, message: "Internal server error" }
        )
    }
}

export const register = async ( req: Request, res: Response ) => {
    const { name, email, password } = req.body

    const findUser = await UserModel.findOne(
        { email: email }
    )

    if ( findUser ) {
        return res.json(
            { status: false, error: 'email', message: 'User already exists' }
        )
    }

    let isUnique = false;
    let key;
    while (!isUnique) {
        // Generate Key
        key = generateKey(email, password);
        
        // Find a user with key that matches the generated one
        const findUser = await UserModel.findOne({verification_code: key})

        if ( !findUser ) {
            isUnique = true;
        } 
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new UserModel(
        {
            name,
            email,
            password: hashedPassword,
            verification_code: key

        }
    )
    if ( isUnique ) {
        await newUser.save();


        const userInventoryObj = {
            user_id: newUser._id,
            locations: [],
            total_quantity: 0
        }

        // This will add the object to each itemModel
        const itemModels = await ItemModel.find({});
        for (const itemModel of itemModels) {
            if (itemModel.user_inventory) {
                itemModel.user_inventory.push(userInventoryObj)
            }
            await itemModel.save();
        }

        const newLocation = new LocationModel(
            {
                user_id: newUser._id,
                locations: [
                    {
                        name: "Default Base",
                        longitude: 10,
                        latitude: 10,
                        active: false,
                        color: "red",
                        _id: new ObjectId()
                    }
                ]
            }
        )

        newLocation.save()

        let mailContent = `
        <div 
            style="
                text-align: center;
                width: 100%;
                max-width: 50%;
                background-color: #FFFFFF;
                margin: auto;
                border-radius: 50px;
                padding: 50px 10px;
                color: black;
            "
            >
            <div 
                style="
                    margin: auto;
                    gap: 30px;
                    background-color: #F0F0F0;
                    width: 100%;
                    padding: 40px 20px;
                    color: black;
                "
            >
                <p>${key}</p>
            </div>
        </div>
        `

        const transporter = nodeMailer.createTransport({
            host: "mail.duppie-develops.co.za",
            port: 465,
            secure: true,
            auth: {
                user: "welcome@duppie-develops.co.za",
                pass: "dZ&#Mb{181qS"
            }
        });
    
        const mailInformation = {
            from: '"Arkive welcome" <welcome@duppie-develops.co.za>',
            to: email,
            subject: "Welcome! Let's verify!",
            html: mailContent
        }
    
        transporter.sendMail(mailInformation, (error, info) => {
            if (error) {
                return console.log(error)
            }
        })

        return res.status(201).json({status: true, message: "User has been successfully created."})
    }
}

export const auth = async (req: Request, res: Response): Promise<jwt.JwtPayload | null> => {
    const { token } = req.body

    if (!token) {
        console.log("The token is missing")
        return res.json({ status: false, message: 'Missing Token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        return res.json({ status: true, message: 'Token is valid.', decoded });
    } catch (error) {
        return res.json({ status: false, message: 'Invalid token.' });
    }
};