-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.emotion_reports;
DROP TABLE IF EXISTS public.post_journey_records;
DROP TABLE IF EXISTS public.during_journey_records;
DROP TABLE IF EXISTS public.pre_journey_records;
DROP TABLE IF EXISTS public.journey_sessions;
DROP TYPE IF EXISTS journey_status;
DROP TYPE IF EXISTS emotion_category;

-- Enable Row Level Security
ALTER TABLE IF EXISTS public.journey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pre_journey_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.during_journey_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_journey_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emotion_reports ENABLE ROW LEVEL SECURITY;

-- Create enum types
CREATE TYPE journey_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE emotion_category AS ENUM ('positive', 'negative', 'neutral');

-- Create journey_sessions table
CREATE TABLE IF NOT EXISTS public.journey_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    status journey_status DEFAULT 'not_started',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create pre_journey_records table
CREATE TABLE IF NOT EXISTS public.pre_journey_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.journey_sessions(id) ON DELETE CASCADE,
    physical_condition TEXT,
    current_mood TEXT,
    mood_details TEXT,
    resolutions TEXT[], -- 다짐 항목들 (체크리스트)
    desires TEXT, -- 욕심나는 것들 (자유 텍스트)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(session_id)
);

-- Create during_journey_records table
CREATE TABLE IF NOT EXISTS public.during_journey_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.journey_sessions(id) ON DELETE CASCADE,
    focus_object TEXT NOT NULL, -- 집중한 대상
    focus_reason TEXT, -- 오래 본 이유
    emotions TEXT[], -- 떠오른 감정들
    imagery TEXT, -- 떠오른 이미지
    rest_moments TEXT, -- 쉼의 순간
    notable_sensations TEXT, -- 인상 깊은 감각
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(session_id)
);

-- Create post_journey_records table
CREATE TABLE IF NOT EXISTS public.post_journey_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.journey_sessions(id) ON DELETE CASCADE,
    state_comparison TEXT, -- 출발 전/중/후 상태 비교
    longest_emotion TEXT, -- 가장 오래 머문 감정
    longest_place TEXT, -- 가장 오래 머문 장소
    journey_message TEXT, -- 여행이 준 메시지
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(session_id)
);

-- Create emotion_reports table
CREATE TABLE IF NOT EXISTS public.emotion_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.journey_sessions(id) ON DELETE CASCADE,
    emotion_flow TEXT, -- 감정 흐름 분석
    recurring_themes TEXT[], -- 반복적 관심사/테마
    sensory_elements TEXT[], -- 감각적 요소 분석
    ai_feedback TEXT, -- AI의 다정한 피드백
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_latest BOOLEAN DEFAULT true -- 최신 리포트 여부
);

-- Create RLS policies

-- Journey Sessions policies
CREATE POLICY "Users can view their own journey sessions"
    ON public.journey_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journey sessions"
    ON public.journey_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journey sessions"
    ON public.journey_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journey sessions"
    ON public.journey_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Pre Journey Records policies
CREATE POLICY "Users can view their own pre journey records"
    ON public.pre_journey_records
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.journey_sessions
        WHERE journey_sessions.id = pre_journey_records.session_id
        AND journey_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own pre journey records"
    ON public.pre_journey_records
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.journey_sessions
        WHERE journey_sessions.id = pre_journey_records.session_id
        AND journey_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own pre journey records"
    ON public.pre_journey_records
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.journey_sessions
        WHERE journey_sessions.id = pre_journey_records.session_id
        AND journey_sessions.user_id = auth.uid()
    ));

-- During Journey Records policies
CREATE POLICY "Users can view their own during journey records"
    ON public.during_journey_records
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.journey_sessions
        WHERE journey_sessions.id = during_journey_records.session_id
        AND journey_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own during journey records"
    ON public.during_journey_records
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.journey_sessions
        WHERE journey_sessions.id = during_journey_records.session_id
        AND journey_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own during journey records"
    ON public.during_journey_records
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.journey_sessions
        WHERE journey_sessions.id = during_journey_records.session_id
        AND journey_sessions.user_id = auth.uid()
    ));

-- Post Journey Records policies
CREATE POLICY "Users can view their own post journey records"
    ON public.post_journey_records
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.journey_sessions
        WHERE journey_sessions.id = post_journey_records.session_id
        AND journey_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own post journey records"
    ON public.post_journey_records
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.journey_sessions
        WHERE journey_sessions.id = post_journey_records.session_id
        AND journey_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own post journey records"
    ON public.post_journey_records
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.journey_sessions
        WHERE journey_sessions.id = post_journey_records.session_id
        AND journey_sessions.user_id = auth.uid()
    ));

-- Emotion Reports policies
CREATE POLICY "Users can view their own emotion reports"
    ON public.emotion_reports
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.journey_sessions
        WHERE journey_sessions.id = emotion_reports.session_id
        AND journey_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own emotion reports"
    ON public.emotion_reports
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.journey_sessions
        WHERE journey_sessions.id = emotion_reports.session_id
        AND journey_sessions.user_id = auth.uid()
    ));

-- Function to update emotion report is_latest flag
CREATE OR REPLACE FUNCTION public.handle_new_emotion_report()
RETURNS TRIGGER AS $$
BEGIN
    -- Set is_latest to false for all previous reports of this session
    UPDATE public.emotion_reports
    SET is_latest = false
    WHERE session_id = NEW.session_id
    AND id != NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new emotion report
CREATE OR REPLACE TRIGGER on_new_emotion_report
    AFTER INSERT ON public.emotion_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_emotion_report();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER handle_journey_sessions_updated_at
    BEFORE UPDATE ON public.journey_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_pre_journey_records_updated_at
    BEFORE UPDATE ON public.pre_journey_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_during_journey_records_updated_at
    BEFORE UPDATE ON public.during_journey_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_post_journey_records_updated_at
    BEFORE UPDATE ON public.post_journey_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 