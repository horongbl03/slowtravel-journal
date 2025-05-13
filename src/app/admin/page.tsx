"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { BarChart2, Users, FileText, User } from 'lucide-react';

interface Stats {
  totalSessions: number;
  totalUsers: number;
  totalEmotionReports: number;
  newUsers7: number;
  newUsers30: number;
  activeUsers7: number;
  activeUsers30: number;
  avgRecordsPerUser: number;
  preRate: number;
  duringRate: number;
  postRate: number;
}

interface MonthlyData {
  month: string;
  sessions: number;
  reports: number;
}

interface ThemePieData {
  name: string;
  value: number;
}

interface UserRow {
  user_id: string;
  created_at: string;
}

interface SessionRow {
  id: string;
  created_at: string;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [themePie, setThemePie] = useState<ThemePieData[]>([]);

  useEffect(() => {
    async function fetchStats() {
      // 전체 여행 세션 수
      const { count: totalSessions } = await supabase
        .from("journey_sessions")
        .select("id", { count: "exact", head: true });
      // 전체 사용자 수
      const { data: userRows } = await supabase
        .from("journey_sessions")
        .select("user_id");
      const userSet = new Set(userRows?.map((row: { user_id: string }) => row.user_id));
      const totalUsers = userSet.size;
      // 감정 리포트 수
      const { count: totalEmotionReports } = await supabase
        .from("emotion_reports")
        .select("id", { count: "exact", head: true });
      // 1인당 평균 기록 수
      const avgRecordsPerUser = totalUsers > 0 ? (totalSessions || 0) / totalUsers : 0;
      // 최근 7/30일 신규 가입자 (user_id 기준, created_at)
      const now = new Date();
      const d7 = new Date(now); d7.setDate(now.getDate() - 7);
      const d30 = new Date(now); d30.setDate(now.getDate() - 30);
      const { data: userRows7 } = await supabase
        .from("journey_sessions")
        .select("user_id, created_at");
      const newUsers7 = new Set(userRows7?.filter((row: UserRow) => new Date(row.created_at) >= d7).map((row: UserRow) => row.user_id)).size;
      const newUsers30 = new Set(userRows7?.filter((row: UserRow) => new Date(row.created_at) >= d30).map((row: UserRow) => row.user_id)).size;
      // 최근 7/30일 활동자 (세션 생성 기준)
      const activeUsers7 = new Set(userRows7?.filter((row: UserRow) => new Date(row.created_at) >= d7).map((row: UserRow) => row.user_id)).size;
      const activeUsers30 = new Set(userRows7?.filter((row: UserRow) => new Date(row.created_at) >= d30).map((row: UserRow) => row.user_id)).size;
      // 여행 전/중/후 기록 작성률
      const { count: preCount } = await supabase
        .from("pre_journey_records")
        .select("id", { count: "exact", head: true });
      const { count: duringCount } = await supabase
        .from("during_journey_records")
        .select("id", { count: "exact", head: true });
      const { count: postCount } = await supabase
        .from("post_journey_records")
        .select("id", { count: "exact", head: true });
      const preRate = totalSessions ? (preCount || 0) / totalSessions : 0;
      const duringRate = totalSessions ? (duringCount || 0) / totalSessions : 0;
      const postRate = totalSessions ? (postCount || 0) / totalSessions : 0;
      setStats({
        totalSessions: totalSessions || 0,
        totalUsers,
        totalEmotionReports: totalEmotionReports || 0,
        newUsers7,
        newUsers30,
        activeUsers7,
        activeUsers30,
        avgRecordsPerUser: Number(avgRecordsPerUser.toFixed(2)),
        preRate,
        duringRate,
        postRate,
      });
      // 월별 여행 세션/감정 리포트 수
      const { data: sessionRows } = await supabase
        .from("journey_sessions")
        .select("id, created_at");
      const { data: reportRows } = await supabase
        .from("emotion_reports")
        .select("id, created_at");
      // 월별 집계
      const monthMap: Record<string, { sessions: number; reports: number }> = {};
      sessionRows?.forEach((row: SessionRow) => {
        const month = row.created_at?.slice(0, 7);
        if (!monthMap[month]) monthMap[month] = { sessions: 0, reports: 0 };
        monthMap[month].sessions++;
      });
      reportRows?.forEach((row: SessionRow) => {
        const month = row.created_at?.slice(0, 7);
        if (!monthMap[month]) monthMap[month] = { sessions: 0, reports: 0 };
        monthMap[month].reports++;
      });
      setMonthlyData(
        Object.entries(monthMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, v]) => ({ month, ...v }))
      );
      // 감정 분포 (긍정/부정/중립)
      const { data: emotionRows } = await supabase
        .from("emotion_reports")
        .select("emotion_flow");
      const emotionFlowMap = new Map<string, number>();
      emotionRows?.forEach((row: { emotion_flow: string }) => {
        const flow = row.emotion_flow;
        if (flow) {
          const count = emotionFlowMap.get(flow) || 0;
          emotionFlowMap.set(flow, count + 1);
        }
      });

      const { data: recurringThemesRows } = await supabase
        .from("emotion_reports")
        .select("recurring_themes");
      const recurringThemesMap = new Map<string, number>();
      recurringThemesRows?.forEach((row: { recurring_themes: string[] }) => {
        const themes = row.recurring_themes;
        if (Array.isArray(themes)) {
          themes.forEach((theme) => {
            const count = recurringThemesMap.get(theme) || 0;
            recurringThemesMap.set(theme, count + 1);
          });
        }
      });
      // 상위 6개만 보여주고, 나머지는 '기타'로 묶기
      const sortedThemes = Object.entries(recurringThemesMap).sort((a, b) => b[1] - a[1]);
      const topN = 6;
      const topThemes = sortedThemes.slice(0, topN);
      const otherThemes = sortedThemes.slice(topN);
      const otherCount = otherThemes.reduce((sum, [, value]) => sum + value, 0);
      let themePieData = [
        ...topThemes.map(([name, value]) => ({ name, value })),
        ...(otherCount > 0 ? [{ name: '기타', value: otherCount }] : [])
      ];
      // '테스트'로 시작하는 테마 제외
      themePieData = themePieData.filter(item => !item.name.startsWith('테스트'));
      setThemePie(themePieData);
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl py-10 px-4">
        <h1 className="text-2xl font-bold mb-8">슬로우트래블 저널 어드민 대시보드</h1>
        {loading ? (
          <div>로딩 중...</div>
        ) : (
          <>
            {/* 주요 통계 카드 */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-md p-6 min-w-[180px] min-h-[140px] mx-2 my-2">
                <BarChart2 className="w-8 h-8 text-blue-500 mb-2" />
                <div className="text-gray-500 text-sm">전체 여행 세션 수</div>
                <div className="mt-1 text-3xl font-bold text-gray-900">{stats?.totalSessions}</div>
              </div>
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-md p-6 min-w-[180px] min-h-[140px] mx-2 my-2">
                <Users className="w-8 h-8 text-green-500 mb-2" />
                <div className="text-gray-500 text-sm">전체 사용자 수</div>
                <div className="mt-1 text-3xl font-bold text-gray-900">{stats?.totalUsers}</div>
              </div>
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-md p-6 min-w-[180px] min-h-[140px] mx-2 my-2">
                <FileText className="w-8 h-8 text-purple-500 mb-2" />
                <div className="text-gray-500 text-sm">감정 리포트 수</div>
                <div className="mt-1 text-3xl font-bold text-gray-900">{stats?.totalEmotionReports}</div>
              </div>
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-md p-6 min-w-[180px] min-h-[140px] mx-2 my-2">
                <User className="w-8 h-8 text-orange-500 mb-2" />
                <div className="text-gray-500 text-sm">1인당 평균 기록 수</div>
                <div className="mt-1 text-3xl font-bold text-gray-900">{stats?.avgRecordsPerUser}</div>
              </div>
            </div>
            {/* 활동자/신규 가입자 */}
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">최근 가입/활동 통계</h2>
              <div className="flex flex-row divide-x divide-gray-200">
                <div className="flex-1 text-center px-6">
                  <div className="text-gray-500 mb-2">신규 가입자(7일)</div>
                  <div className="text-2xl font-bold">{stats?.newUsers7}</div>
                </div>
                <div className="flex-1 text-center px-6">
                  <div className="text-gray-500 mb-2">신규 가입자(30일)</div>
                  <div className="text-2xl font-bold">{stats?.newUsers30}</div>
                </div>
                <div className="flex-1 text-center px-6">
                  <div className="text-gray-500 mb-2">활동자(7일)</div>
                  <div className="text-2xl font-bold">{stats?.activeUsers7}</div>
                </div>
                <div className="flex-1 text-center px-6">
                  <div className="text-gray-500 mb-2">활동자(30일)</div>
                  <div className="text-2xl font-bold">{stats?.activeUsers30}</div>
                </div>
              </div>
            </div>
            {/* 월별 여행 세션/감정 리포트 수 그래프 */}
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">월별 여행 세션/감정 리포트 수</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sessions" fill="#8884d8" name="여행 세션" />
                  <Bar dataKey="reports" fill="#82ca9d" name="감정 리포트" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* 여행 전/중/후 기록 작성률 */}
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">여행 전/중/후 기록 작성률</h2>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="text-gray-500 mb-1">여행 전</div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${(stats?.preRate ?? 0) * 100}%` }} />
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">{Math.round((stats?.preRate ?? 0) * 100)}%</div>
                </div>
                <div className="flex-1">
                  <div className="text-gray-500 mb-1">여행 중</div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-green-500 h-4 rounded-full" style={{ width: `${(stats?.duringRate ?? 0) * 100}%` }} />
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">{Math.round((stats?.duringRate ?? 0) * 100)}%</div>
                </div>
                <div className="flex-1">
                  <div className="text-gray-500 mb-1">여행 후</div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-yellow-500 h-4 rounded-full" style={{ width: `${(stats?.postRate ?? 0) * 100}%` }} />
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">{Math.round((stats?.postRate ?? 0) * 100)}%</div>
                </div>
              </div>
            </div>
            {/* 감정/테마별 분포 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">테마 분포</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={themePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} 
                      label={({ name, value }) => `${name} (${value})`}>
                      {themePie.map((entry, idx) => (
                        <Cell key={`cell-theme-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 