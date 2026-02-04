"use client"

import Link from "next/link"
import { FolderKanban, CheckCircle2, Users, BarChart3, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderKanban className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Task Manager</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Đăng nhập</Button>
            </Link>
            <Link href="/signup">
              <Button>Đăng ký ngay</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Quản lý công việc hiệu quả <br className="hidden sm:block" />
          <span className="text-blue-600">cho đội nhóm của bạn</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto mb-10">
          Đơn giản hóa quy trình làm việc, theo dõi tiến độ và cộng tác dễ dàng hơn bao giờ hết với Task Manager. Công cụ Kanban mạnh mẽ cho mọi dự án.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="h-12 px-8 text-lg">
              Bắt đầu miễn phí <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
              Đăng nhập
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<CheckCircle2 className="h-8 w-8 text-green-500" />} 
              title="Quản lý Kanban" 
              description="Trực quan hóa công việc với bảng Kanban. Kéo thả dễ dàng để cập nhật trạng thái."
            />
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-blue-500" />} 
              title="Cộng tác nhóm" 
              description="Mời thành viên, giao việc, bình luận và chia sẻ tệp tin trong thời gian thực."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-8 w-8 text-purple-500" />} 
              title="Theo dõi tiến độ" 
              description="Nắm bắt mọi hoạt động của dự án với lịch sử chi tiết và báo cáo trực quan."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>&copy; 2024 Task Manager System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="mb-4 bg-gray-50 w-14 h-14 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  )
}
