// app/api/payment/billing-info/route.ts
import { auth } from "@/auth";
import { db } from "@/db";
import { UsersTable, UserAddressTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch user's saved billing info
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user data
    const [user] = await db
      .select({
        gstNumber: UsersTable.gstNumber,
        isGstVerified: UsersTable.isGstVerified,
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's default address
    const [address] = await db
      .select({
        addressLine1: UserAddressTable.addressLine1,
        addressLine2: UserAddressTable.addressLine2,
        city: UserAddressTable.city,
        state: UserAddressTable.state,
        pinCode: UserAddressTable.pinCode,
        country: UserAddressTable.country,
      })
      .from(UserAddressTable)
      .where(
        and(
          eq(UserAddressTable.userId, session.user.id),
          eq(UserAddressTable.isDefault, true)
        )
      )
      .limit(1);

    // Return saved billing data
    return NextResponse.json({
      gstNumber: user.gstNumber || null,
      isGstVerified: user.isGstVerified || false,
      gstData: user.isGstVerified && user.gstNumber ? {
        gstin: user.gstNumber
        // Additional GST data would need to be stored separately
      } : null,
      address: address || null
    });

  } catch (error) {
    console.error("Error fetching billing info:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing information" },
      { status: 500 }
    );
  }
}

// POST: Save user's billing info for future use
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { gstNumber, gstData, address } = await req.json();

    // Update user's GST information
    if (gstNumber) {
      await db
        .update(UsersTable)
        .set({
          gstNumber: gstNumber,
          isGstVerified: !!gstData,
          updatedAt: new Date(),
        })
        .where(eq(UsersTable.id, session.user.id));
    }

    // Save address if provided
    if (address) {
      const { addressLine1, addressLine2, city, state, pinCode, country } = address;
      
      // Check if user already has a default address
      const [existingAddress] = await db
        .select({ id: UserAddressTable.id })
        .from(UserAddressTable)
        .where(
          and(
            eq(UserAddressTable.userId, session.user.id),
            eq(UserAddressTable.isDefault, true)
          )
        )
        .limit(1);

      if (existingAddress) {
        // Update existing address
        await db
          .update(UserAddressTable)
          .set({
            addressLine1,
            addressLine2: addressLine2 || "",
            city,
            state,
            pinCode,
            country: country || "India",
            updatedAt: new Date(),
          })
          .where(eq(UserAddressTable.id, existingAddress.id));
      } else {
        // Create new address
        await db
          .insert(UserAddressTable)
          .values({
            userId: session.user.id,
            addressLine1,
            addressLine2: addressLine2 || "",
            city,
            state,
            pinCode,
            country: country || "India",
            isDefault: true,
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Billing information saved successfully"
    });

  } catch (error) {
    console.error("Error saving billing info:", error);
    return NextResponse.json(
      { error: "Failed to save billing information" },
      { status: 500 }
    );
  }
}