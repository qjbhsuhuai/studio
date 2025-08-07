
import { NextRequest, NextResponse } from 'next/server';
import { get, ref, set, query, orderByChild, equalTo } from "firebase/database";
import { db } from "@/lib/firebase";

function getIP(req: NextRequest) {
    let ip = req.ip ?? req.headers.get('x-real-ip');
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (!ip && forwardedFor) {
        ip = forwardedFor.split(',').at(0) ?? null;
    }
    return ip;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { firstName, lastName, email, password } = body;

        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
        }

        if (password.length < 6) {
             return NextResponse.json({ message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
        }

        const ip = getIP(req);
        const sanitizedIp = ip ? ip.replace(/[.#$[\]/]/g, '_') : 'unknown';

        const userId = email.replace(/[.#$[\]]/g, "_");
        const userRef = ref(db, 'users/' + userId);
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists()) {
            return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
        }

        // Check if IP has registered before
        const ipRef = ref(db, `ipRegistry/${sanitizedIp}`);
        const ipSnapshot = await get(ipRef);

        let userStatus = "Active";
        let responseMessage = "สร้างบัญชีสำเร็จ บัญชีของคุณพร้อมใช้งานแล้ว";
        let requiresApproval = false;
        
        if (ipSnapshot.exists()) {
            // IP has registered before, set new account to Pending
            userStatus = "Pending";
            responseMessage = "สร้างบัญชีสำเร็จ! เนื่องจาก IP ของคุณเคยลงทะเบียนแล้ว บัญชีนี้ต้องรอการอนุมัติจากผู้ดูแลระบบ";
            requiresApproval = true;
        }


        const newUser = {
            firstName,
            lastName,
            email,
            password,
            role: email.toLowerCase() === 'admin@example.com' ? 'Admin' : 'User',
            credits: 0,
            status: userStatus,
            registeredIp: ip,
        };

        await set(userRef, newUser);
        
        // If it was a new IP, record it
        if (userStatus === 'Active') {
            await set(ipRef, { userId, email, timestamp: Date.now() });
        }

        return NextResponse.json({ message: responseMessage, requiresApproval }, { status: 201 });

    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }, { status: 500 });
    }
}
