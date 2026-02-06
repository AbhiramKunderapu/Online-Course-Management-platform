from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_connection
import os
from dotenv import load_dotenv
import requests
import json

load_dotenv()

app = Flask(__name__)
app.secret_key = "supersecretkey"
CORS(app)  # Enable CORS for React frontend

# Supabase Auth URL (get from your Supabase project settings)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


# =============================
# AUTHENTICATION
# =============================

@app.route("/api/login", methods=["POST"])
def login():
    """Login endpoint - returns user data"""
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password", "")  # Optional for now

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT user_id, name, email, role
            FROM public.users
            WHERE email = %s
        """, (email,))

        user = cur.fetchone()

        cur.close()
        conn.close()

        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        # Return user data
        return jsonify({
            "success": True,
            "user": {
                "user_id": str(user[0]),
                "name": user[1],
                "email": user[2],
                "role": user[3]
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/signup", methods=["POST"])
def signup():
    """Sign up endpoint - creates new user via Supabase Auth"""
    try:
        data = request.get_json()
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        role = data.get("role", "student")  # Default to student

        if not all([name, email, password]):
            return jsonify({"error": "Name, email, and password are required"}), 400

        # Create user in Supabase Auth
        if SUPABASE_URL and SUPABASE_SERVICE_KEY:
            auth_url = f"{SUPABASE_URL}/auth/v1/admin/users"
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "email": email,
                "password": password,
                "email_confirm": True,  # Auto-confirm email
                "user_metadata": {
                    "name": name
                }
            }

            response = requests.post(auth_url, headers=headers, json=payload)
            
            if response.status_code not in [200, 201]:
                error_msg = response.json().get("msg", "Failed to create user")
                return jsonify({"error": f"Signup failed: {error_msg}"}), 400

            auth_user = response.json()
            user_id = auth_user.get("id")

            # The trigger should auto-create the profile, but let's ensure it exists
            conn = get_connection()
            cur = conn.cursor()

            # Update user profile with name and role
            cur.execute("""
                UPDATE public.users 
                SET name = %s, role = %s
                WHERE user_id = %s
            """, (name, role, user_id))

            # If user doesn't exist (trigger didn't fire), create it
            if cur.rowcount == 0:
                cur.execute("""
                    INSERT INTO public.users (user_id, name, email, role)
                    VALUES (%s, %s, %s, %s)
                """, (user_id, name, email, role))

            # Create student/instructor record based on role
            if role == "student":
                cur.execute("""
                    INSERT INTO public.student (user_id)
                    VALUES (%s)
                    ON CONFLICT (user_id) DO NOTHING
                """, (user_id,))
            elif role == "instructor":
                cur.execute("""
                    INSERT INTO public.instructor (user_id)
                    VALUES (%s)
                    ON CONFLICT (user_id) DO NOTHING
                """, (user_id,))

            conn.commit()
            cur.close()
            conn.close()

            return jsonify({
                "success": True,
                "message": "User created successfully",
                "user": {
                    "user_id": str(user_id),
                    "name": name,
                    "email": email,
                    "role": role
                }
            })

        else:
            # Fallback: Create user directly in database (for testing without Supabase Auth)
            conn = get_connection()
            cur = conn.cursor()

            # Generate UUID (you'll need to import uuid)
            import uuid
            user_id = uuid.uuid4()

            cur.execute("""
                INSERT INTO public.users (user_id, name, email, role)
                VALUES (%s, %s, %s, %s)
                RETURNING user_id
            """, (user_id, name, email, role))

            if role == "student":
                cur.execute("""
                    INSERT INTO public.student (user_id)
                    VALUES (%s)
                """, (user_id,))
            elif role == "instructor":
                cur.execute("""
                    INSERT INTO public.instructor (user_id)
                    VALUES (%s)
                """, (user_id,))

            conn.commit()
            cur.close()
            conn.close()

            return jsonify({
                "success": True,
                "message": "User created successfully (without auth)",
                "user": {
                    "user_id": str(user_id),
                    "name": name,
                    "email": email,
                    "role": role
                }
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =============================
# DASHBOARD DATA
# =============================

@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    """Get dashboard data based on user role"""
    try:
        user_id = request.args.get("user_id")
        role = request.args.get("role")

        if not user_id or not role:
            return jsonify({"error": "user_id and role are required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        if role == "student":
            cur.execute("""
                SELECT total_courses_enrolled, total_courses_completed
                FROM public.student
                WHERE user_id = %s
            """, (user_id,))
            data = cur.fetchone()
            result = {
                "enrolled_count": data[0] if data else 0,
                "completed_count": data[1] if data else 0
            }

        elif role == "instructor":
            cur.execute("""
                SELECT total_courses
                FROM public.instructor
                WHERE user_id = %s
            """, (user_id,))
            data = cur.fetchone()
            result = {
                "total_courses": data[0] if data else 0
            }

        elif role == "administrator":
            cur.execute("SELECT COUNT(*) FROM public.users")
            total_users = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM public.course")
            total_courses = cur.fetchone()[0]
            result = {
                "total_users": total_users,
                "total_courses": total_courses
            }

        elif role == "data_analyst":
            cur.execute("SELECT COUNT(*) FROM public.enrolled_in")
            total_enrollments = cur.fetchone()[0]
            result = {
                "total_enrollments": total_enrollments
            }

        else:
            return jsonify({"error": "Invalid role"}), 400

        cur.close()
        conn.close()

        return jsonify({"success": True, "data": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =============================
# COURSES
# =============================

@app.route("/api/courses", methods=["GET"])
def courses():
    """Get all courses"""
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT course_id, title, duration, level, description, fees
            FROM public.course
            ORDER BY title
        """)

        courses = cur.fetchall()
        cur.close()
        conn.close()

        # Convert to list of dicts
        courses_list = []
        for course in courses:
            courses_list.append({
                "course_id": str(course[0]),
                "title": course[1],
                "duration": course[2],
                "level": course[3],
                "description": course[4],
                "fees": float(course[5]) if course[5] else None
            })

        return jsonify({"success": True, "courses": courses_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/courses/enroll", methods=["POST"])
def enroll():
    """Enroll in a course"""
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        course_id = data.get("course_id")

        if not user_id or not course_id:
            return jsonify({"error": "user_id and course_id are required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO public.enrolled_in(user_id, course_id, status)
            VALUES (%s, %s::uuid, 'ongoing')
            ON CONFLICT (user_id, course_id) DO NOTHING
            RETURNING enroll_date
        """, (user_id, course_id))

        if cur.rowcount == 0:
            return jsonify({"error": "Already enrolled or invalid course"}), 400

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "message": "Enrolled successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/courses/my-courses", methods=["GET"])
def my_courses():
    """Get enrolled courses for a user"""
    try:
        user_id = request.args.get("user_id")
        status = request.args.get("status")  # Optional filter: 'ongoing', 'completed', 'dropped'
        
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        if status:
            cur.execute("""
                SELECT c.course_id, c.title, c.duration, c.level, e.status, 
                       e.enroll_date, e.grade, e.completion_date
                FROM public.enrolled_in e
                JOIN public.course c ON c.course_id = e.course_id
                WHERE e.user_id = %s AND e.status = %s
                ORDER BY e.enroll_date DESC
            """, (user_id, status))
        else:
            cur.execute("""
                SELECT c.course_id, c.title, c.duration, c.level, e.status, 
                       e.enroll_date, e.grade, e.completion_date
                FROM public.enrolled_in e
                JOIN public.course c ON c.course_id = e.course_id
                WHERE e.user_id = %s
                ORDER BY e.enroll_date DESC
            """, (user_id,))

        courses = cur.fetchall()
        cur.close()
        conn.close()

        courses_list = []
        for course in courses:
            courses_list.append({
                "course_id": str(course[0]),
                "title": course[1],
                "duration": course[2],
                "level": course[3],
                "status": course[4],
                "enroll_date": str(course[5]) if course[5] else None,
                "grade": course[6],
                "completion_date": str(course[7]) if course[7] else None
            })

        return jsonify({"success": True, "courses": courses_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/student/profile", methods=["GET"])
def get_student_profile():
    """Get student personal information"""
    try:
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT u.user_id, u.name, u.email, s.branch, s.country, s.dob, s.phone_number
            FROM public.users u
            JOIN public.student s ON s.user_id = u.user_id
            WHERE u.user_id = %s
        """, (user_id,))

        student = cur.fetchone()
        cur.close()
        conn.close()

        if not student:
            return jsonify({"error": "Student not found"}), 404

        return jsonify({
            "success": True,
            "profile": {
                "user_id": str(student[0]),
                "name": student[1],
                "email": student[2],
                "branch": student[3],
                "country": student[4],
                "dob": str(student[5]) if student[5] else None,
                "phone_number": student[6]
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/student/profile", methods=["PUT"])
def update_student_profile():
    """Update student personal information (except name and email)"""
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        # Extract updatable fields
        branch = data.get("branch")
        country = data.get("country")
        dob = data.get("dob")
        phone_number = data.get("phone_number")

        conn = get_connection()
        cur = conn.cursor()

        # Build update query dynamically
        updates = []
        params = []
        
        if branch is not None:
            updates.append("branch = %s")
            params.append(branch)
        if country is not None:
            updates.append("country = %s")
            params.append(country)
        if dob is not None:
            updates.append("dob = %s")
            params.append(dob)
        if phone_number is not None:
            updates.append("phone_number = %s")
            params.append(phone_number)

        if not updates:
            return jsonify({"error": "No fields to update"}), 400

        params.append(user_id)
        query = f"UPDATE public.student SET {', '.join(updates)} WHERE user_id = %s"
        
        cur.execute(query, params)
        conn.commit()

        cur.close()
        conn.close()

        return jsonify({"success": True, "message": "Profile updated successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =============================
# ADMIN ROUTES
# =============================

@app.route("/api/admin/users", methods=["GET"])
def get_users():
    """Get all users (admin only)"""
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT user_id, name, email, role
            FROM public.users
            ORDER BY created_at DESC
        """)

        users = cur.fetchall()
        cur.close()
        conn.close()

        users_list = []
        for user in users:
            users_list.append({
                "user_id": str(user[0]),
                "name": user[1],
                "email": user[2],
                "role": user[3]
            })

        return jsonify({"success": True, "users": users_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/users/<user_id>", methods=["DELETE"])
def delete_student(user_id):
    """Delete a student (admin only)"""
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM public.student WHERE user_id = %s::uuid", (user_id,))
        cur.execute("DELETE FROM public.users WHERE user_id = %s::uuid", (user_id,))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "message": "User deleted"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/assign", methods=["POST"])
def assign_instructor():
    """Assign instructor to course (admin only)"""
    try:
        data = request.get_json()
        instructor_id = data.get("instructor_id")
        course_id = data.get("course_id")

        if not instructor_id or not course_id:
            return jsonify({"error": "instructor_id and course_id are required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO public.teaches(instructor_id, course_id)
            VALUES (%s::uuid, %s::uuid)
            ON CONFLICT DO NOTHING
        """, (instructor_id, course_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "message": "Instructor assigned"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/courses", methods=["GET"])
def admin_courses():
    """Get all courses (admin view)"""
    return courses()  # Reuse the courses endpoint


@app.route("/api/admin/instructors", methods=["GET"])
def get_instructors():
    """Get all instructors with details (admin only)"""
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT u.user_id, u.name, u.email, i.branch, i.phone_number
            FROM public.users u
            JOIN public.instructor i ON i.user_id = u.user_id
            ORDER BY u.name
        """)

        instructors = cur.fetchall()
        cur.close()
        conn.close()

        instructors_list = []
        for instructor in instructors:
            instructors_list.append({
                "user_id": str(instructor[0]),
                "name": instructor[1],
                "email": instructor[2],
                "branch": instructor[3] or "N/A",
                "phone_number": instructor[4] or "N/A"
            })

        return jsonify({"success": True, "instructors": instructors_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =============================
# INSTRUCTOR ROUTES
# =============================

@app.route("/api/instructor/courses", methods=["GET"])
def get_instructor_courses():
    """Get all courses taught by an instructor"""
    try:
        instructor_id = request.args.get("instructor_id")
        if not instructor_id:
            return jsonify({"error": "instructor_id is required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT c.course_id, c.title, c.duration, c.level, c.description,
                   COUNT(e.user_id) as enrolled_count
            FROM public.teaches t
            JOIN public.course c ON c.course_id = t.course_id
            LEFT JOIN public.enrolled_in e ON e.course_id = c.course_id AND e.status != 'dropped'
            WHERE t.instructor_id = %s
            GROUP BY c.course_id, c.title, c.duration, c.level, c.description
            ORDER BY c.title
        """, (instructor_id,))

        courses = cur.fetchall()
        cur.close()
        conn.close()

        courses_list = []
        for course in courses:
            courses_list.append({
                "course_id": str(course[0]),
                "title": course[1],
                "duration": course[2],
                "level": course[3],
                "description": course[4],
                "enrolled_count": course[5]
            })

        return jsonify({"success": True, "courses": courses_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/instructor/courses/<course_id>/students", methods=["GET"])
def get_course_students(course_id):
    """Get all students enrolled in a course (instructor only)"""
    try:
        instructor_id = request.args.get("instructor_id")
        if not instructor_id:
            return jsonify({"error": "instructor_id is required"}), 400

        # Verify instructor teaches this course
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT COUNT(*) FROM public.teaches
            WHERE instructor_id = %s AND course_id = %s
        """, (instructor_id, course_id))

        if cur.fetchone()[0] == 0:
            return jsonify({"error": "You don't teach this course"}), 403

        cur.execute("""
            SELECT u.user_id, u.name, u.email, e.status, e.grade, 
                   e.enroll_date, e.completion_date
            FROM public.enrolled_in e
            JOIN public.users u ON u.user_id = e.user_id
            WHERE e.course_id = %s AND e.status != 'dropped'
            ORDER BY u.name
        """, (course_id,))

        students = cur.fetchall()
        cur.close()
        conn.close()

        students_list = []
        for student in students:
            students_list.append({
                "user_id": str(student[0]),
                "name": student[1],
                "email": student[2],
                "status": student[3],
                "grade": student[4],
                "enroll_date": str(student[5]) if student[5] else None,
                "completion_date": str(student[6]) if student[6] else None
            })

        return jsonify({"success": True, "students": students_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/instructor/grade", methods=["POST"])
def grade_student():
    """Grade a student (instructor only)"""
    try:
        data = request.get_json()
        instructor_id = data.get("instructor_id")
        course_id = data.get("course_id")
        student_id = data.get("student_id")
        grade = data.get("grade")
        status = data.get("status", "completed")  # Default to completed when grading

        if not all([instructor_id, course_id, student_id, grade]):
            return jsonify({"error": "All fields are required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        # Verify instructor teaches this course
        cur.execute("""
            SELECT COUNT(*) FROM public.teaches
            WHERE instructor_id = %s AND course_id = %s
        """, (instructor_id, course_id))

        if cur.fetchone()[0] == 0:
            return jsonify({"error": "You don't teach this course"}), 403

        # Update grade and status
        cur.execute("""
            UPDATE public.enrolled_in
            SET grade = %s, status = %s, completion_date = CURRENT_DATE
            WHERE user_id = %s AND course_id = %s
        """, (grade, status, student_id, course_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "message": "Student graded successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/instructor/remove-student", methods=["POST"])
def remove_student_from_course():
    """Remove a student from course (instructor only)"""
    try:
        data = request.get_json()
        instructor_id = data.get("instructor_id")
        course_id = data.get("course_id")
        student_id = data.get("student_id")

        if not all([instructor_id, course_id, student_id]):
            return jsonify({"error": "All fields are required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        # Verify instructor teaches this course
        cur.execute("""
            SELECT COUNT(*) FROM public.teaches
            WHERE instructor_id = %s AND course_id = %s
        """, (instructor_id, course_id))

        if cur.fetchone()[0] == 0:
            return jsonify({"error": "You don't teach this course"}), 403

        # Update status to dropped
        cur.execute("""
            UPDATE public.enrolled_in
            SET status = 'dropped'
            WHERE user_id = %s AND course_id = %s
        """, (student_id, course_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "message": "Student removed from course"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/instructor/courses/<course_id>/modules", methods=["GET"])
def get_course_modules(course_id):
    """Get all modules for a course"""
    try:
        instructor_id = request.args.get("instructor_id")
        if not instructor_id:
            return jsonify({"error": "instructor_id is required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        # Verify instructor teaches this course
        cur.execute("""
            SELECT COUNT(*) FROM public.teaches
            WHERE instructor_id = %s AND course_id = %s
        """, (instructor_id, course_id))

        if cur.fetchone()[0] == 0:
            return jsonify({"error": "You don't teach this course"}), 403

        cur.execute("""
            SELECT module_number, name, duration
            FROM public.module
            WHERE course_id = %s
            ORDER BY module_number
        """, (course_id,))

        modules = cur.fetchall()
        cur.close()
        conn.close()

        modules_list = []
        for module in modules:
            modules_list.append({
                "module_number": module[0],
                "name": module[1],
                "duration": module[2]
            })

        return jsonify({"success": True, "modules": modules_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/instructor/module", methods=["POST"])
def create_module():
    """Create a new module for a course (instructor only)"""
    try:
        data = request.get_json()
        instructor_id = data.get("instructor_id")
        course_id = data.get("course_id")
        module_number = data.get("module_number")
        name = data.get("name")
        duration = data.get("duration", "")

        if not all([instructor_id, course_id, module_number, name]):
            return jsonify({"error": "instructor_id, course_id, module_number, and name are required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        # Verify instructor teaches this course
        cur.execute("""
            SELECT COUNT(*) FROM public.teaches
            WHERE instructor_id = %s AND course_id = %s
        """, (instructor_id, course_id))

        if cur.fetchone()[0] == 0:
            return jsonify({"error": "You don't teach this course"}), 403

        # Check if module number already exists
        cur.execute("""
            SELECT COUNT(*) FROM public.module
            WHERE course_id = %s AND module_number = %s
        """, (course_id, module_number))

        if cur.fetchone()[0] > 0:
            return jsonify({"error": "Module number already exists for this course"}), 400

        # Insert module
        cur.execute("""
            INSERT INTO public.module (course_id, module_number, name, duration)
            VALUES (%s, %s, %s, %s)
            RETURNING course_id, module_number
        """, (course_id, module_number, name, duration))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Module created successfully"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/instructor/module-content", methods=["POST"])
def add_module_content():
    """Add content to a module (instructor only)"""
    try:
        data = request.get_json()
        instructor_id = data.get("instructor_id")
        course_id = data.get("course_id")
        module_number = data.get("module_number")
        title = data.get("title")
        content_type = data.get("type")
        url = data.get("url")

        if not all([instructor_id, course_id, module_number, title, content_type, url]):
            return jsonify({"error": "All fields are required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        # Verify instructor teaches this course
        cur.execute("""
            SELECT COUNT(*) FROM public.teaches
            WHERE instructor_id = %s AND course_id = %s
        """, (instructor_id, course_id))

        if cur.fetchone()[0] == 0:
            return jsonify({"error": "You don't teach this course"}), 403

        # Verify module exists
        cur.execute("""
            SELECT COUNT(*) FROM public.module
            WHERE course_id = %s AND module_number = %s
        """, (course_id, module_number))

        if cur.fetchone()[0] == 0:
            return jsonify({"error": "Module does not exist"}), 404

        # Insert content
        cur.execute("""
            INSERT INTO public.module_content (course_id, module_number, title, type, url)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING content_id
        """, (course_id, module_number, title, content_type, url))

        content_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Content added successfully",
            "content_id": str(content_id)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =============================
# STUDENT COURSE CONTENT ROUTES
# =============================

@app.route("/api/student/courses/<course_id>/modules", methods=["GET"])
def get_student_course_modules(course_id):
    """Get modules and content for a course (student only)"""
    try:
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        conn = get_connection()
        cur = conn.cursor()

        # Verify student is enrolled in this course
        cur.execute("""
            SELECT COUNT(*) FROM public.enrolled_in
            WHERE user_id = %s AND course_id = %s AND status != 'dropped'
        """, (user_id, course_id))

        if cur.fetchone()[0] == 0:
            return jsonify({"error": "You are not enrolled in this course"}), 403

        # Get modules with their content
        cur.execute("""
            SELECT m.module_number, m.name, m.duration,
                   mc.content_id, mc.title, mc.type, mc.url
            FROM public.module m
            LEFT JOIN public.module_content mc ON mc.course_id = m.course_id 
                AND mc.module_number = m.module_number
            WHERE m.course_id = %s
            ORDER BY m.module_number, mc.content_id
        """, (course_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        # Organize modules and content
        modules_dict = {}
        for row in rows:
            module_num = row[0]
            if module_num not in modules_dict:
                modules_dict[module_num] = {
                    "module_number": module_num,
                    "name": row[1],
                    "duration": row[2],
                    "content": []
                }
            
            # Add content if exists
            if row[3]:  # content_id
                modules_dict[module_num]["content"].append({
                    "content_id": str(row[3]),
                    "title": row[4],
                    "type": row[5],
                    "url": row[6]
                })

        modules_list = list(modules_dict.values())

        return jsonify({"success": True, "modules": modules_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =============================
# HEALTH CHECK
# =============================

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "API is running"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
