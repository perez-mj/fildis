// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('@/views/ChangePassword.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/views/Unauthorized.vue')
  },
  {
    path: '/',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // Admin routes
      {
        path: 'admin',
        meta: { role: 'admin' },
        children: [
          {
            path: 'dashboard',
            name: 'AdminDashboard',
            component: () => import('@/views/admin/AdminDashboard.vue')
          },
          {
            path: 'teachers',
            name: 'ManageTeachers',
            component: () => import('@/views/admin/ManageTeachers.vue')
          },
          {
            path: 'students',
            name: 'ManageStudents',
            component: () => import('@/views/admin/ManageStudents.vue')
          },
          {
            path: 'courses',
            name: 'ManageCourses',
            component: () => import('@/views/admin/ManageCourses.vue')
          },
          {
            path: 'enrollments',
            name: 'CourseEnrollment',
            component: () => import('@/views/admin/CourseEnrollment.vue')
          },
          {
            path: 'teacher-assignment',
            name: 'TeacherAssignment',
            component: () => import('@/views/admin/TeacherAssignment.vue')
          },
          {
            path: 'announcements',
            name: 'SchoolAnnouncements',
            component: () => import('@/views/admin/SchoolAnnouncements.vue')
          }
        ]
      },
      // Teacher routes
      {
        path: 'teacher',
        meta: { role: 'teacher' },
        children: [
          {
            path: 'dashboard',
            name: 'TeacherDashboard',
            component: () => import('@/views/teacher/TeacherDashboard.vue')
          },
          {
            path: 'courses',
            name: 'TeacherCourses',
            component: () => import('@/views/teacher/MyCourses.vue')
          },
          {
            path: 'courses/:courseId/materials',
            name: 'CourseMaterials',
            component: () => import('@/views/teacher/CourseMaterials.vue')
          },
          {
            path: 'assignments',
            name: 'ManageAssignments',
            component: () => import('@/views/teacher/ManageAssignments.vue')
          },
          {
            path: 'assignments/:assignmentId/submissions',
            name: 'AssignmentSubmissions',
            component: () => import('@/views/teacher/AssignmentSubmissions.vue')
          },
          {
            path: 'submissions/:submissionId/grade',
            name: 'GradeSubmission',
            component: () => import('@/views/teacher/GradeSubmission.vue')
          },
          {
            path: 'announcements',
            name: 'PostAnnouncement',
            component: () => import('@/views/teacher/PostAnnouncement.vue')
          }
        ]
      },
      // Student routes
      {
        path: 'student',
        meta: { role: 'student' },
        children: [
          {
            path: 'dashboard',
            name: 'StudentDashboard',
            component: () => import('@/views/student/StudentDashboard.vue')
          },
          {
            path: 'courses',
            name: 'StudentCourses',
            component: () => import('@/views/student/MyCourses.vue')
          },
          {
            path: 'courses/:courseId/materials',
            name: 'StudentCourseMaterials',
            component: () => import('@/views/student/CourseMaterials.vue')
          },
          {
            path: 'assignments',
            name: 'MyAssignments',
            component: () => import('@/views/student/MyAssignments.vue')
          },
          {
            path: 'assignments/:assignmentId/submit',
            name: 'SubmitAssignment',
            component: () => import('@/views/student/SubmitAssignment.vue')
          },
          {
            path: 'grades',
            name: 'MyGrades',
            component: () => import('@/views/student/MyGrades.vue')
          },
          {
            path: 'announcements',
            name: 'ViewAnnouncements',
            component: () => import('@/views/student/ViewAnnouncements.vue')
          }
        ]
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.role && authStore.userRole !== to.meta.role && authStore.userRole !== 'admin') {
    next('/unauthorized')
  } else {
    next()
  }
})

export default router