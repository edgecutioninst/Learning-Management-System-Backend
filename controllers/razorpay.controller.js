import Razorpay from "razorpay";
import User from "../models/user.model.js";
import crypto from "crypto"
import Course from "../models/course.model.js";
import CoursePurchase from "../models/coursePurchase.model.js";

// GET RAZORPAY CREDENTIALS
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
}); //create razorpay object

export const createRazorpayOrder = async (req, res) => {
    try {
        const userId = req.id

        const { courseId } = req.body

        const course = await Course.findById(courseId)

        if (!course) return res.status(404).json({ message: "Course not found" })

        const newPurchase = new CoursePurchase({
            course: courseId,
            user: userId,
            amount: course.price,
            currency: "INR",
            status: "pending",
            paymentMethod: "RAZORPAY"
        })

        const options = {
            amount: Math.round(course.price * 100),
            currency: "INR",
            receipt: newPurchase._id.toString(),
            notes: {
                courseId: courseId,
                userId: userId
            }
        }

        const order = await razorpay.orders.create(options)
        // console.log(order)

        newPurchase.paymentId = order.id
        await newPurchase.save()

        res.status(200).json({
            success: true,
            data: order,
            message: "Order created successfully",
            course: {
                name: course.title,
                description: course.description
            }
        })


    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}



export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        } = req.body

        const body = razorpay_order_id + "|" + razorpay_payment_id

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex")
        //

        // const isAuthentic = expectedSignature === 

        const isAuthentic = crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(razorpay_signature, 'hex')
        );

        if (!isAuthentic) {
            return res.status(400).json({ message: "Payment Failed" })
        }

        const purchase = await CoursePurchase.findOne({
            paymentId: razorpay_order_id
        })

        if (!purchase) {
            return res.status(400).json({ message: "Payment Failed" })
        }

        if (!purchase.metadata) {
            purchase.metadata = new Map();
        }

        purchase.metadata.set("razorpay_payment_id", razorpay_payment_id);
        purchase.metadata.set("razorpay_order_id", razorpay_order_id);

        purchase.status = "completed"
        purchase.paymentId = razorpay_payment_id;
        await purchase.save()

        await Course.findByIdAndUpdate(purchase.course, {
            $addToSet: { enrolledStudents: purchase.user }
        });

        await User.findByIdAndUpdate(purchase.user, {
            $addToSet: { enrolledCourses: purchase.course }
        });

        res.status(200).json({
            success: true,
            data: purchase,
            message: "Payment verified successfully"
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

export const getCourseDetailsWithPurchaseStatus = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.id;

        const course = await Course.findById(courseId)
            .populate({ path: "creator", select: "name photoUrl" })
            .populate({ path: "lectures" });

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const hasAccess = course.enrolledStudents.includes(userId);

        res.status(200).json({
            success: true,
            course,
            hasAccess
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}