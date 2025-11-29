// app/api/question-banks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  QuestionBanksTable,
  AssessmentQuestionsTable,
  DepartmentsTable,
  UsersTable,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/question-banks?collegeId={collegeId}
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collegeId = searchParams.get("collegeId");
    const departmentId = searchParams.get("departmentId");
    const isShared = searchParams.get("isShared");
    const questionBankId = searchParams.get("id");

    // Get single question bank
    if (questionBankId) {
      const questionBank = await db
        .select({
          id: QuestionBanksTable.id,
          name: QuestionBanksTable.name,
          description: QuestionBanksTable.description,
          tags: QuestionBanksTable.tags,
          isShared: QuestionBanksTable.isShared,
          isActive: QuestionBanksTable.isActive,
          department: {
            name: DepartmentsTable.name,
            code: DepartmentsTable.code,
          },
          createdBy: {
            name: UsersTable.name,
            email: UsersTable.email,
          },
          questionCount: sql<number>`count(distinct ${AssessmentQuestionsTable.id})`.as("questionCount"),
          createdAt: QuestionBanksTable.createdAt,
        })
        .from(QuestionBanksTable)
        .leftJoin(DepartmentsTable, eq(QuestionBanksTable.departmentId, DepartmentsTable.id))
        .leftJoin(UsersTable, eq(QuestionBanksTable.createdBy, UsersTable.id))
        .leftJoin(
          AssessmentQuestionsTable,
          eq(QuestionBanksTable.id, AssessmentQuestionsTable.questionBankId)
        )
        .where(eq(QuestionBanksTable.id, questionBankId))
        .groupBy(QuestionBanksTable.id, DepartmentsTable.id, UsersTable.id)
        .limit(1);

      if (!questionBank.length) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Question bank not found" } },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: questionBank[0] });
    }

    // Get question banks list
    if (!collegeId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "College ID required" } },
        { status: 400 }
      );
    }

    const conditions = [eq(QuestionBanksTable.collegeId, collegeId)];
    if (departmentId) conditions.push(eq(QuestionBanksTable.departmentId, departmentId));
    if (isShared === "true") conditions.push(eq(QuestionBanksTable.isShared, true));

    const questionBanks = await db
      .select({
        id: QuestionBanksTable.id,
        name: QuestionBanksTable.name,
        description: QuestionBanksTable.description,
        departmentName: DepartmentsTable.name,
        questionCount: sql<number>`count(distinct ${AssessmentQuestionsTable.id})`.as("questionCount"),
        isShared: QuestionBanksTable.isShared,
        tags: QuestionBanksTable.tags,
        createdBy: {
          name: UsersTable.name,
        },
      })
      .from(QuestionBanksTable)
      .leftJoin(DepartmentsTable, eq(QuestionBanksTable.departmentId, DepartmentsTable.id))
      .leftJoin(UsersTable, eq(QuestionBanksTable.createdBy, UsersTable.id))
      .leftJoin(
        AssessmentQuestionsTable,
        eq(QuestionBanksTable.id, AssessmentQuestionsTable.questionBankId)
      )
      .where(and(...conditions))
      .groupBy(QuestionBanksTable.id, DepartmentsTable.id, UsersTable.id);

    return NextResponse.json({ success: true, data: questionBanks });
  } catch (error) {
    console.error("Question Banks GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST /api/question-banks - Create new question bank
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      collegeId,
      departmentId,
      name,
      description,
      tags,
      isShared,
      createdBy,
    } = body;

    if (!collegeId || !name || !createdBy) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const [newQuestionBank] = await db
      .insert(QuestionBanksTable)
      .values({
        collegeId,
        departmentId,
        name,
        description,
        tags,
        isShared: isShared || false,
        createdBy,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: newQuestionBank, message: "Question bank created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Question Banks POST error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// PUT /api/question-banks?id={questionBankId}
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const questionBankId = searchParams.get("id");

    if (!questionBankId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Question Bank ID required" } },
        { status: 400 }
      );
    }

    const body = await request.json();

    const [updated] = await db
      .update(QuestionBanksTable)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(QuestionBanksTable.id, questionBankId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Question bank updated successfully",
    });
  } catch (error) {
    console.error("Question Banks PUT error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// DELETE /api/question-banks?id={questionBankId}
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const questionBankId = searchParams.get("id");

    if (!questionBankId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Question Bank ID required" } },
        { status: 400 }
      );
    }

    await db.delete(QuestionBanksTable).where(eq(QuestionBanksTable.id, questionBankId));

    return NextResponse.json({
      success: true,
      message: "Question bank deleted successfully",
    });
  } catch (error) {
    console.error("Question Banks DELETE error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// ====================================
// app/api/question-banks/questions/route.ts
// ====================================

// GET /api/question-banks/questions?questionBankId={questionBankId}
export async function GET_QUESTIONS(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const questionBankId = searchParams.get("questionBankId");
    const difficulty = searchParams.get("difficulty");
    const questionType = searchParams.get("questionType");

    if (!questionBankId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Question Bank ID required" } },
        { status: 400 }
      );
    }

    const conditions = [eq(AssessmentQuestionsTable.questionBankId, questionBankId)];
    if (difficulty) conditions.push(eq(AssessmentQuestionsTable.difficulty, difficulty as any));
    if (questionType) conditions.push(eq(AssessmentQuestionsTable.questionType, questionType as any));

    const questions = await db
      .select({
        id: AssessmentQuestionsTable.id,
        questionText: AssessmentQuestionsTable.questionText,
        questionType: AssessmentQuestionsTable.questionType,
        difficulty: AssessmentQuestionsTable.difficulty,
        options: AssessmentQuestionsTable.options,
        correctAnswer: AssessmentQuestionsTable.correctAnswer,
        points: AssessmentQuestionsTable.points,
        explanation: AssessmentQuestionsTable.explanation,
        sortOrder: AssessmentQuestionsTable.sortOrder,
      })
      .from(AssessmentQuestionsTable)
      .where(and(...conditions))
      .orderBy(AssessmentQuestionsTable.sortOrder);

    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error("Question Bank questions GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST /api/question-banks/questions - Add question to bank
export async function POST_QUESTION(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      questionBankId,
      questionText,
      questionType,
      difficulty,
      options,
      correctAnswer,
      points,
      explanation,
      tags,
    } = body;

    if (!questionBankId || !questionText || !correctAnswer) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const [newQuestion] = await db
      .insert(AssessmentQuestionsTable)
      .values({
        assessmentId: "", // Will be null for question bank questions
        questionBankId,
        questionText,
        questionType: questionType || "MULTIPLE_CHOICE",
        difficulty: difficulty || "MEDIUM",
        options,
        correctAnswer,
        points: points || 1,
        explanation,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: newQuestion, message: "Question added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Question Bank question POST error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// PUT /api/question-banks/questions?id={questionId}
export async function PUT_QUESTION(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const questionId = searchParams.get("id");

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Question ID required" } },
        { status: 400 }
      );
    }

    const body = await request.json();

    const [updated] = await db
      .update(AssessmentQuestionsTable)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(AssessmentQuestionsTable.id, questionId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Question updated successfully",
    });
  } catch (error) {
    console.error("Question Bank question PUT error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// DELETE /api/question-banks/questions?id={questionId}
export async function DELETE_QUESTION(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const questionId = searchParams.get("id");

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Question ID required" } },
        { status: 400 }
      );
    }

    await db
      .delete(AssessmentQuestionsTable)
      .where(eq(AssessmentQuestionsTable.id, questionId));

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Question Bank question DELETE error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// ====================================
// app/api/question-banks/import/route.ts
// ====================================

// POST /api/question-banks/import - Import questions to assessment
export async function POST_IMPORT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentId, questionBankId, questionIds } = body;

    if (!assessmentId || !questionBankId || !questionIds || !questionIds.length) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    // Get questions from question bank
    const questions = await db
      .select()
      .from(AssessmentQuestionsTable)
      .where(
        and(
          eq(AssessmentQuestionsTable.questionBankId, questionBankId),
          sql`${AssessmentQuestionsTable.id} = ANY(${questionIds})`
        )
      );

    // Insert questions into assessment
    const importedQuestions = await Promise.all(
      questions.map(async (q) => {
        const [imported] = await db
          .insert(AssessmentQuestionsTable)
          .values({
            assessmentId,
            questionBankId: q.questionBankId,
            questionText: q.questionText,
            questionType: q.questionType,
            difficulty: q.difficulty,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points,
            explanation: q.explanation,
          })
          .returning();
        return imported;
      })
    );

    return NextResponse.json({
      success: true,
      data: importedQuestions,
      message: `${importedQuestions.length} questions imported successfully`,
    });
  } catch (error) {
    console.error("Question import error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}