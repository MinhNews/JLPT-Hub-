import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { apiFetch, API_BASE_URL, endpoints, setApiToken } from './src/api';
import { levelMeta, LevelId, minnaLessonTitles, n3Modules, resourceCards } from './src/data';
import { Button, Card, EmptyState, Loading, makePalette, Palette, SectionTitle } from './src/ui';
import type { AdminStats, CoursePlan, Exam, ExamQuestion, ProgressState, SubscriptionStatus, Transaction, User } from './src/types';

type MainTab = 'home' | 'learn' | 'exams' | 'notebook' | 'pricing' | 'profile' | 'admin';
type DetailRoute =
  | { type: 'module'; moduleId: string }
  | { type: 'minna'; lesson: number }
  | { type: 'exams'; level: string }
  | { type: 'examDetail'; level: string; examId: string }
  | { type: 'examRoom'; level: string; examId: string; section: string }
  | null;

const blankProgress: ProgressState = {
  vocabMastered: [],
  kanjiMastered: [],
  grammarMastered: [],
  readingMastered: [],
  listeningMastered: [],
  minnaMastered: [],
};

const tokenKey = 'jlpt_mobile_access_token';

function normalizeUser(user: any): User {
  return {
    ...user,
    id: user.id || user._id,
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value || 0) + ' đ';
}

function stripHtml(value: string) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function HtmlBlock({ html, palette }: { html: string; palette: Palette }) {
  const { width } = useWindowDimensions();
  return (
    <RenderHTML
      contentWidth={width - 64}
      source={{ html: html || '' }}
      baseStyle={{ color: palette.text, fontSize: 16, lineHeight: 24 }}
      tagsStyles={{
        rt: { color: palette.muted, fontSize: 10 },
        u: { textDecorationLine: 'underline' },
        p: { marginBottom: 8 },
      }}
    />
  );
}

export default function App() {
  const [dark, setDark] = useState(true);
  const palette = useMemo(() => makePalette(dark), [dark]);
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({ isVip: false });
  const [progress, setProgress] = useState<ProgressState>(blankProgress);
  const [level, setLevel] = useState<LevelId>('N3');
  const [tab, setTab] = useState<MainTab>('home');
  const [detail, setDetail] = useState<DetailRoute>(null);

  const isVip = subscription.isVip || user?.role === 'admin';

  const authedGet = async () => {
    const [me, sub, prog] = await Promise.all([
      apiFetch<any>(endpoints.me),
      apiFetch<SubscriptionStatus>(endpoints.subscription),
      apiFetch<ProgressState>(endpoints.progress),
    ]);
    setUser(normalizeUser(me));
    setSubscription(sub);
    setProgress({ ...blankProgress, ...prog });
  };

  useEffect(() => {
    const boot = async () => {
      try {
        const stored = await SecureStore.getItemAsync(tokenKey);
        if (stored) {
          setApiToken(stored);
          await authedGet();
        }
      } catch {
        await SecureStore.deleteItemAsync(tokenKey);
      } finally {
        setBooting(false);
      }
    };
    boot();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<{ accessToken: string; user: User }>(endpoints.login, {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    setApiToken(data.accessToken);
    await SecureStore.setItemAsync(tokenKey, data.accessToken);
    setUser(normalizeUser(data.user));
    await authedGet();
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(tokenKey);
    setApiToken('');
    setUser(null);
    setSubscription({ isVip: false });
    setProgress(blankProgress);
    setTab('home');
    setDetail(null);
  };

  const toggleProgress = async (type: string, lessonId: string | number) => {
    await apiFetch(endpoints.progressToggle, {
      method: 'POST',
      body: JSON.stringify({ type, lessonId: String(lessonId), status: 'mastered' }),
    });
    const prog = await apiFetch<ProgressState>(endpoints.progress);
    setProgress({ ...blankProgress, ...prog });
  };

  if (booting) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
        <Loading palette={palette} text="Đang mở JLPT Hub..." />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthScreen palette={palette} dark={dark} setDark={setDark} onLogin={login} />;
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: palette.border, backgroundColor: palette.card }]}>
        <View>
          <Text style={[styles.brand, { color: palette.text }]}>JLPT Hub</Text>
          <Text style={{ color: palette.sub, fontSize: 12 }}>{user.name} · {user.role === 'admin' ? 'Admin' : isVip ? 'VIP' : 'Thường'}</Text>
        </View>
        <Pressable onPress={() => setDark(!dark)} style={[styles.iconBtn, { backgroundColor: palette.card2 }]}>
          <Text style={{ color: palette.text, fontWeight: '900' }}>{dark ? '☀' : '☾'}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={authedGet} tintColor={palette.primary} />}
      >
        {detail ? (
          <DetailSwitch
            detail={detail}
            setDetail={setDetail}
            palette={palette}
            progress={progress}
            isVip={isVip}
            toggleProgress={toggleProgress}
            setTab={setTab}
            refreshAccount={authedGet}
          />
        ) : (
          <MainSwitch
            tab={tab}
            setTab={setTab}
            setDetail={setDetail}
            palette={palette}
            user={user}
            logout={logout}
            level={level}
            setLevel={setLevel}
            progress={progress}
            isVip={isVip}
            subscription={subscription}
            refreshAccount={authedGet}
          />
        )}
      </ScrollView>

      {!detail ? (
        <BottomNav palette={palette} tab={tab} setTab={setTab} isAdmin={user.role === 'admin'} />
      ) : null}
    </SafeAreaView>
  );
}

function AuthScreen({
  palette,
  dark,
  setDark,
  onLogin,
}: {
  palette: Palette;
  dark: boolean;
  setDark: (value: boolean) => void;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'register') {
        await apiFetch(endpoints.register, {
          method: 'POST',
          auth: false,
          body: JSON.stringify({ name, email, password }),
        });
      }
      await onLogin(email, password);
    } catch (error: any) {
      Alert.alert('Không đăng nhập được', error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
      <ScrollView contentContainerStyle={[styles.content, { justifyContent: 'center', flexGrow: 1 }]}>
        <Card palette={palette} style={{ padding: 22 }}>
          <View style={{ alignItems: 'center', marginBottom: 22 }}>
            <Text style={{ fontSize: 44 }}>🎓</Text>
            <Text style={[styles.heroTitle, { color: palette.text }]}>JLPT Hub Mobile</Text>
            <Text style={{ color: palette.sub, textAlign: 'center' }}>Cùng tài khoản, cùng tiến độ, cùng VIP với bản web.</Text>
          </View>
          {mode === 'register' ? <Input palette={palette} placeholder="Tên hiển thị" value={name} onChangeText={setName} /> : null}
          <Input palette={palette} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <Input palette={palette} placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />
          <Button title={busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} onPress={submit} palette={palette} disabled={busy} />
          <View style={{ height: 10 }} />
          <Button
            title={mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
            onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
            palette={palette}
            variant="ghost"
          />
          <View style={{ height: 10 }} />
          <Button title={dark ? 'Dùng giao diện sáng' : 'Dùng giao diện tối'} onPress={() => setDark(!dark)} palette={palette} variant="ghost" />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Input(props: React.ComponentProps<typeof TextInput> & { palette: Palette }) {
  const { palette, style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={palette.muted}
      style={[styles.input, { backgroundColor: palette.card2, borderColor: palette.border, color: palette.text }, style]}
      {...rest}
    />
  );
}

function MainSwitch(props: {
  tab: MainTab;
  setTab: (tab: MainTab) => void;
  setDetail: (route: DetailRoute) => void;
  palette: Palette;
  user: User;
  logout: () => void;
  level: LevelId;
  setLevel: (level: LevelId) => void;
  progress: ProgressState;
  isVip: boolean;
  subscription: SubscriptionStatus;
  refreshAccount: () => Promise<void>;
}) {
  if (props.tab === 'home') return <HomeScreen {...props} />;
  if (props.tab === 'learn') return <LearnScreen {...props} />;
  if (props.tab === 'exams') return <ExamHubScreen {...props} />;
  if (props.tab === 'notebook') return <NotebookScreen palette={props.palette} />;
  if (props.tab === 'pricing') return <PricingScreen palette={props.palette} refreshAccount={props.refreshAccount} />;
  if (props.tab === 'admin') return <AdminScreen palette={props.palette} user={props.user} />;
  return <ProfileScreen palette={props.palette} user={props.user} subscription={props.subscription} logout={props.logout} refreshAccount={props.refreshAccount} />;
}

function HomeScreen({
  palette,
  level,
  setLevel,
  progress,
  isVip,
  setDetail,
  setTab,
}: {
  palette: Palette;
  level: LevelId;
  setLevel: (level: LevelId) => void;
  progress: ProgressState;
  isVip: boolean;
  setDetail: (route: DetailRoute) => void;
  setTab: (tab: MainTab) => void;
}) {
  const meta = levelMeta[level];
  return (
    <View>
      <SectionTitle title="Bản đồ học tập" subtitle="Chọn cấp độ và tiếp tục đúng tiến độ đã đồng bộ với web." palette={palette} />
      <LevelSwitch palette={palette} level={level} setLevel={setLevel} />
      {level === 'N5' || level === 'N4' ? (
        <MinnaMap palette={palette} level={level} progress={progress} isVip={isVip} openLesson={(lesson) => setDetail({ type: 'minna', lesson })} />
      ) : level === 'N3' ? (
        <N3Dashboard palette={palette} progress={progress} openModule={(moduleId) => setDetail({ type: 'module', moduleId })} />
      ) : (
        <Card palette={palette}>
          <Text style={{ color: meta.color, fontSize: 28, fontWeight: '900' }}>{level}</Text>
          <Text style={{ color: palette.text, fontWeight: '800', marginTop: 8 }}>Cấp độ này đang được chuẩn bị.</Text>
          <Text style={{ color: palette.sub, marginTop: 4 }}>JLPT Hub sẽ mở nội dung {level} trong các bản cập nhật sau.</Text>
        </Card>
      )}
      <Button title="Mở kho luyện đề" onPress={() => setTab('exams')} palette={palette} variant="ghost" />
    </View>
  );
}

function LevelSwitch({ palette, level, setLevel }: { palette: Palette; level: LevelId; setLevel: (level: LevelId) => void }) {
  return (
    <View style={[styles.levelRow, { backgroundColor: palette.card, borderColor: palette.border }]}>
      {(Object.keys(levelMeta) as LevelId[]).map((id) => {
        const meta = levelMeta[id];
        const active = level === id;
        return (
          <Pressable
            key={id}
            disabled={!meta.available}
            onPress={() => setLevel(id)}
            style={[
              styles.levelPill,
              { backgroundColor: active ? meta.color : 'transparent', opacity: meta.available ? 1 : 0.42 },
            ]}
          >
            <Text style={{ color: active ? '#fff' : palette.text, fontWeight: '900' }}>{id}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MinnaMap({
  palette,
  level,
  progress,
  isVip,
  openLesson,
}: {
  palette: Palette;
  level: 'N5' | 'N4';
  progress: ProgressState;
  isVip: boolean;
  openLesson: (lesson: number) => void;
}) {
  const [start, end] = levelMeta[level].range;
  const lessons = Array.from({ length: 25 }, (_, i) => start + i);
  const color = levelMeta[level].color;
  return (
    <View>
      <Text style={[styles.sectionHeading, { color: palette.text }]}>
        {level === 'N5' ? 'Giáo trình Minna no Nihongo N5' : 'Giáo trình Minna no Nihongo N4'}
      </Text>
      <View style={styles.grid2}>
        {lessons.map((lesson) => {
          const locked = lesson > 2 && !isVip;
          const done = progress.minnaMastered.includes(lesson);
          return (
            <Pressable key={lesson} onPress={() => (locked ? Alert.alert('Cần VIP', 'Nâng cấp VIP để mở khóa bài này.') : openLesson(lesson))}>
              <Card palette={palette} style={{ minHeight: 116, opacity: locked ? 0.58 : 1 }}>
                <Text style={{ color, fontWeight: '900', fontSize: 18 }}>Bài {lesson}</Text>
                <Text numberOfLines={2} style={{ color: palette.text, fontWeight: '700', marginTop: 8 }}>{minnaLessonTitles[lesson]}</Text>
                <Text style={{ color: done ? palette.success : locked ? palette.warning : palette.sub, marginTop: 10, fontSize: 12, fontWeight: '800' }}>
                  {done ? 'Đã hoàn thành' : locked ? 'VIP' : 'Mở học'}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function N3Dashboard({ palette, progress, openModule }: { palette: Palette; progress: ProgressState; openModule: (moduleId: string) => void }) {
  return (
    <View>
      <Text style={[styles.sectionHeading, { color: palette.text }]}>Chương trình N3</Text>
      <View style={styles.grid2}>
        {n3Modules.map((module) => {
          const count = (progress[module.progressKey as keyof ProgressState] as unknown[] | undefined)?.length || 0;
          return (
            <Pressable key={module.id} onPress={() => openModule(module.id)}>
              <Card palette={palette} style={{ minHeight: 132 }}>
                <Text style={{ fontSize: 28 }}>{module.icon}</Text>
                <Text style={{ color: palette.text, fontWeight: '900', marginTop: 8 }}>{module.title}</Text>
                <Text style={{ color: palette.sub, marginTop: 6 }}>{count}/{module.total}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LearnScreen({ palette, setDetail }: { palette: Palette; setDetail: (route: DetailRoute) => void }) {
  return (
    <View>
      <SectionTitle title="Kho học liệu" subtitle="Toàn bộ module học trên web được gom lại thành danh sách dễ bấm trên điện thoại." palette={palette} />
      {n3Modules.map((module) => (
        <Pressable key={module.id} onPress={() => setDetail({ type: 'module', moduleId: module.id })}>
          <Card palette={palette}>
            <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900' }}>{module.icon} {module.title}</Text>
            <Text style={{ color: palette.sub, marginTop: 6 }}>Mở danh sách, xem chi tiết và đánh dấu tiến độ.</Text>
          </Card>
        </Pressable>
      ))}
      {resourceCards.map((card) => (
        <Card key={card.title} palette={palette}>
          <Text style={{ color: palette.text, fontWeight: '900' }}>{card.title}</Text>
          <Text style={{ color: palette.sub, marginTop: 6 }}>{card.body}</Text>
        </Card>
      ))}
    </View>
  );
}

function DetailSwitch(props: {
  detail: DetailRoute;
  setDetail: (route: DetailRoute) => void;
  palette: Palette;
  progress: ProgressState;
  isVip: boolean;
  toggleProgress: (type: string, lessonId: string | number) => Promise<void>;
  setTab: (tab: MainTab) => void;
  refreshAccount: () => Promise<void>;
}) {
  if (!props.detail) return null;
  const back = <Button title="← Quay lại" onPress={() => props.setDetail(null)} palette={props.palette} variant="ghost" />;
  if (props.detail.type === 'module') return <ModuleScreen {...props} moduleId={props.detail.moduleId} back={back} />;
  if (props.detail.type === 'minna') return <MinnaDetailScreen {...props} lesson={props.detail.lesson} back={back} />;
  if (props.detail.type === 'exams') return <ExamListScreen {...props} level={props.detail.level} back={back} />;
  if (props.detail.type === 'examDetail') return <ExamDetailScreen {...props} level={props.detail.level} examId={props.detail.examId} back={back} />;
  return <ExamRoomScreen {...props} level={props.detail.level} examId={props.detail.examId} section={props.detail.section} back={back} />;
}

function ModuleScreen({
  palette,
  moduleId,
  back,
  toggleProgress,
}: {
  palette: Palette;
  moduleId: string;
  back: ReactNode;
  toggleProgress: (type: string, lessonId: string | number) => Promise<void>;
}) {
  const learningModule = n3Modules.find((item) => item.id === moduleId) || n3Modules[0];
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<any>(learningModule.endpoint, { auth: false });
        setItems(Array.isArray(data) ? data : data.lessons || data.items || data.data || []);
      } catch (error: any) {
        Alert.alert('Không tải được học liệu', error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [learningModule.endpoint]);

  if (loading) return <><>{back}</><Loading palette={palette} /></>;

  return (
    <View>
      {back}
      <SectionTitle title={learningModule.title} subtitle="Dữ liệu lấy trực tiếp từ backend JLPT Hub." palette={palette} />
      {selected ? (
        <Card palette={palette}>
          <Button title="Đóng chi tiết" onPress={() => setSelected(null)} palette={palette} variant="ghost" />
          <View style={{ height: 12 }} />
          <GenericDetail item={selected} palette={palette} />
          <Button title="Đánh dấu đã học" onPress={() => toggleProgress(learningModule.id === 'kanjill' ? 'kanjill' : learningModule.id, selected._id || selected.id || selected.lesson || selected.title)} palette={palette} variant="success" />
        </Card>
      ) : null}
      {items.length === 0 ? <EmptyState text="Module này chưa có dữ liệu." palette={palette} /> : null}
      {items.slice(0, 120).map((item, index) => (
        <Pressable key={item._id || item.id || index} onPress={() => setSelected(item)}>
          <Card palette={palette}>
            <Text style={{ color: palette.text, fontWeight: '900', fontSize: 16 }}>
              {item.title || item.word || item.kanji || item.grammar || item.name || `Mục ${index + 1}`}
            </Text>
            <Text numberOfLines={2} style={{ color: palette.sub, marginTop: 6 }}>
              {stripHtml(item.meaning || item.description || item.explanation || item.question || item.content || JSON.stringify(item).slice(0, 160))}
            </Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

function GenericDetail({ item, palette }: { item: any; palette: Palette }) {
  const entries = Object.entries(item).filter(([key, value]) => !key.startsWith('_') && value != null && typeof value !== 'object');
  return (
    <View>
      {entries.slice(0, 14).map(([key, value]) => (
        <View key={key} style={{ marginBottom: 12 }}>
          <Text style={{ color: palette.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>{key}</Text>
          {String(value).includes('<') ? (
            <HtmlBlock html={String(value)} palette={palette} />
          ) : (
            <Text style={{ color: palette.text, fontSize: 15, lineHeight: 22 }}>{String(value)}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function MinnaDetailScreen({
  palette,
  lesson,
  back,
  toggleProgress,
}: {
  palette: Palette;
  lesson: number;
  back: ReactNode;
  toggleProgress: (type: string, lessonId: string | number) => Promise<void>;
}) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      try {
        setData(await apiFetch(`/minna/lessons/${lesson}`));
      } catch (error: any) {
        Alert.alert('Không tải được bài Minna', error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lesson]);
  if (loading) return <><>{back}</><Loading palette={palette} /></>;
  return (
    <View>
      {back}
      <SectionTitle title={`Bài ${lesson}: ${minnaLessonTitles[lesson]}`} subtitle="Nội dung Minna no Nihongo đồng bộ với bản web." palette={palette} />
      <Card palette={palette}>
        <GenericDetail item={data || { title: minnaLessonTitles[lesson] }} palette={palette} />
        <Button title="Đánh dấu hoàn thành bài này" onPress={() => toggleProgress('minna', lesson)} palette={palette} variant="success" />
      </Card>
    </View>
  );
}

function ExamHubScreen({ palette, setDetail }: { palette: Palette; setDetail: (route: DetailRoute) => void }) {
  return (
    <View>
      <SectionTitle title="Luyện đề JLPT" subtitle="Chọn cấp độ, vào phòng thi, làm bài với timer và xem đáp án." palette={palette} />
      {(['n5', 'n4', 'n3'] as const).map((lvl) => (
        <Pressable key={lvl} onPress={() => setDetail({ type: 'exams', level: lvl })}>
          <Card palette={palette}>
            <Text style={{ color: palette.text, fontSize: 20, fontWeight: '900' }}>JLPT {lvl.toUpperCase()}</Text>
            <Text style={{ color: palette.sub, marginTop: 6 }}>Danh sách đề thi, từ vựng, ngữ pháp/đọc và nghe hiểu.</Text>
          </Card>
        </Pressable>
      ))}
      {(['n2', 'n1'] as const).map((lvl) => (
        <Card key={lvl} palette={palette} style={{ opacity: 0.5 }}>
          <Text style={{ color: palette.text, fontSize: 20, fontWeight: '900' }}>JLPT {lvl.toUpperCase()}</Text>
          <Text style={{ color: palette.sub, marginTop: 6 }}>Sắp có.</Text>
        </Card>
      ))}
    </View>
  );
}

function ExamListScreen({ palette, level, setDetail, back }: { palette: Palette; level: string; setDetail: (route: DetailRoute) => void; back: ReactNode }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      try {
        setExams(await apiFetch<Exam[]>(`/exams/${level}`, { auth: false }));
      } catch (error: any) {
        Alert.alert('Không tải được đề thi', error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [level]);
  if (loading) return <><>{back}</><Loading palette={palette} /></>;
  return (
    <View>
      {back}
      <SectionTitle title={`Đề thi ${level.toUpperCase()}`} subtitle="Chọn một đề để vào các phần thi." palette={palette} />
      {exams.length === 0 ? <EmptyState text={`Chưa có đề thi cho ${level.toUpperCase()}.`} palette={palette} /> : null}
      {exams.map((exam) => (
        <Pressable key={exam.id} onPress={() => setDetail({ type: 'examDetail', level, examId: exam.id })}>
          <Card palette={palette}>
            <Text style={{ color: palette.text, fontWeight: '900', fontSize: 18 }}>{exam.title || `JLPT ${level.toUpperCase()} ${exam.year || ''}`}</Text>
            <Text style={{ color: palette.sub, marginTop: 6 }}>Tháng {exam.month || 'mock'} · Vào phòng thi</Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

function ExamDetailScreen({ palette, level, examId, setDetail, back }: { palette: Palette; level: string; examId: string; setDetail: (route: DetailRoute) => void; back: ReactNode }) {
  const sections = [
    { id: 'vocabulary', title: 'Từ vựng' },
    { id: 'grammar_reading', title: 'Ngữ pháp & Đọc' },
    { id: 'grammar', title: 'Ngữ pháp' },
    { id: 'listening', title: 'Nghe hiểu' },
  ];
  return (
    <View>
      {back}
      <SectionTitle title="Chọn phần thi" subtitle="Mobile room tối ưu cho thao tác một tay." palette={palette} />
      {sections.map((section) => (
        <Pressable key={section.id} onPress={() => setDetail({ type: 'examRoom', level, examId, section: section.id })}>
          <Card palette={palette}>
            <Text style={{ color: palette.text, fontWeight: '900', fontSize: 18 }}>{section.title}</Text>
            <Text style={{ color: palette.sub, marginTop: 6 }}>Timer, chọn đáp án, nộp bài và xem đáp án.</Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

function ExamRoomScreen({ palette, level, examId, section, back }: { palette: Palette; level: string; examId: string; section: string; back: ReactNode }) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(section === 'listening' ? 35 * 60 : 60 * 60);

  useEffect(() => {
    const load = async () => {
      try {
        const exam = await apiFetch<any>(`/exams/${level}/${examId}`, { auth: false });
        const data = exam[section] || (section === 'grammar_reading' ? exam.grammar : null);
        setQuestions(data?.questions || []);
      } catch (error: any) {
        Alert.alert('Không tải được phòng thi', error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [level, examId, section]);

  useEffect(() => {
    if (submitted || loading) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [submitted, loading]);

  const score = questions.filter((q) => answers[String(q.id)] === q.correct_answer_index).length;
  if (loading) return <><>{back}</><Loading palette={palette} /></>;
  return (
    <View>
      {back}
      <Card palette={palette} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: palette.text, fontSize: 22, fontWeight: '900' }}>
          {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}
        </Text>
        <Button title={submitted ? `${score}/${questions.length} đúng` : 'Nộp bài'} onPress={() => setSubmitted(true)} palette={palette} variant={submitted ? 'success' : 'primary'} />
      </Card>
      {questions.map((q, idx) => (
        <Card key={String(q.id)} palette={palette}>
          <Text style={{ color: palette.primary, fontWeight: '900', marginBottom: 10 }}>Câu {idx + 1}</Text>
          <HtmlBlock html={q.question_text} palette={palette} />
          {q.image_url ? <Image source={{ uri: q.image_url }} style={{ height: 180, borderRadius: 12, marginVertical: 10 }} resizeMode="contain" /> : null}
          {q.audio_url ? <Button title="Mở audio" onPress={() => Linking.openURL(q.audio_url || '')} palette={palette} variant="ghost" /> : null}
          {q.choices.map((choice, choiceIndex) => {
            const selected = answers[String(q.id)] === choiceIndex;
            const correct = submitted && choiceIndex === q.correct_answer_index;
            const wrong = submitted && selected && !correct;
            return (
              <Pressable key={choiceIndex} disabled={submitted} onPress={() => setAnswers((prev) => ({ ...prev, [String(q.id)]: choiceIndex }))}>
                <View style={[styles.choice, { borderColor: correct ? palette.success : wrong ? palette.danger : selected ? palette.primary : palette.border, backgroundColor: selected ? palette.card2 : 'transparent' }]}>
                  <Text style={{ color: palette.text, fontWeight: '800', marginRight: 8 }}>{choiceIndex + 1}.</Text>
                  <View style={{ flex: 1 }}><HtmlBlock html={choice} palette={palette} /></View>
                </View>
              </Pressable>
            );
          })}
        </Card>
      ))}
    </View>
  );
}

function NotebookScreen({ palette }: { palette: Palette }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');

  const load = async () => setEntries(await apiFetch<any[]>(endpoints.notebook));
  useEffect(() => {
    load().catch(() => undefined);
  }, []);
  const save = async () => {
    await apiFetch(endpoints.notebook, { method: 'POST', body: JSON.stringify({ title: title || 'Ghi chú mobile', note }) });
    setTitle('');
    setNote('');
    await load();
  };
  return (
    <View>
      <SectionTitle title="Sổ tay cá nhân" subtitle="Ghi chú lưu chung tài khoản web/mobile." palette={palette} />
      <Card palette={palette}>
        <Input palette={palette} placeholder="Tiêu đề" value={title} onChangeText={setTitle} />
        <Input palette={palette} placeholder="Nội dung ghi chú" value={note} onChangeText={setNote} multiline style={{ minHeight: 100, textAlignVertical: 'top' }} />
        <Button title="Lưu ghi chú" onPress={save} palette={palette} disabled={!note.trim()} />
      </Card>
      {entries.map((entry) => (
        <Card key={entry._id} palette={palette}>
          <Text style={{ color: palette.text, fontWeight: '900' }}>{entry.title || entry.lessonTitle || 'Ghi chú'}</Text>
          <Text style={{ color: palette.sub, marginTop: 6 }}>{entry.note}</Text>
        </Card>
      ))}
    </View>
  );
}

function PricingScreen({ palette, refreshAccount }: { palette: Palette; refreshAccount: () => Promise<void> }) {
  const [plans, setPlans] = useState<CoursePlan[]>([]);
  const [tx, setTx] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    apiFetch<CoursePlan[]>(endpoints.plans, { auth: false }).then(setPlans).catch(() => undefined);
  }, []);

  const buy = async (plan: CoursePlan) => {
    setBusy(true);
    try {
      const data = await apiFetch<{ transaction: Transaction }>(endpoints.subscribe, {
        method: 'POST',
        body: JSON.stringify({ planId: plan._id, paymentMethod: 'bank_transfer' }),
      });
      setTx(data.transaction);
    } catch (error: any) {
      Alert.alert('Không tạo được thanh toán', error.message);
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    if (!tx) return;
    setBusy(true);
    try {
      const data = await apiFetch<Transaction>(`/membership/transactions/${tx._id}/status`);
      setTx(data);
      if (data.status === 'completed') {
        await refreshAccount();
        Alert.alert('Thành công', 'VIP đã được kích hoạt.');
      } else {
        Alert.alert('Đang chờ thanh toán', 'Nếu đã chuyển khoản, vui lòng đợi 10-30 giây rồi kiểm tra lại.');
      }
    } catch (error: any) {
      Alert.alert('Không kiểm tra được', error.message);
    } finally {
      setBusy(false);
    }
  };

  if (tx) {
    const qr = `https://img.vietqr.io/image/vietinbank-101882913508-compact2.png?amount=${tx.amount}&addInfo=SEVQR%20JLPTHUB${tx.transactionId}&accountName=NGUYEN%20DUC%20MINH`;
    return (
      <View>
        <SectionTitle title="Hóa đơn thanh toán" subtitle={`Mã hóa đơn ${tx.transactionId}`} palette={palette} />
        <Card palette={palette} style={{ alignItems: 'center' }}>
          <Image source={{ uri: qr }} style={{ width: 220, height: 220, backgroundColor: '#fff', borderRadius: 12 }} />
          <Text style={{ color: palette.text, fontSize: 24, fontWeight: '900', marginTop: 16 }}>{formatMoney(tx.amount)}</Text>
          <Text style={{ color: palette.sub, marginTop: 8 }}>Nội dung: SEVQR JLPTHUB{tx.transactionId}</Text>
          <View style={{ height: 14 }} />
          <Button title={busy ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản'} onPress={check} palette={palette} variant="success" disabled={busy} />
          <View style={{ height: 10 }} />
          <Button title="Hủy giao dịch" onPress={() => setTx(null)} palette={palette} variant="ghost" />
        </Card>
      </View>
    );
  }

  return (
    <View>
      <SectionTitle title="Nâng cấp VIP Member" subtitle="Thanh toán VietQR/SePay, kích hoạt chung cho web và mobile." palette={palette} />
      {plans.map((plan) => (
        <Card key={plan._id} palette={palette}>
          <Text style={{ color: palette.text, fontWeight: '900', fontSize: 20 }}>{plan.title.replace(/^N3 VIP/i, 'VIP Member')}</Text>
          <Text style={{ color: palette.sub, marginTop: 6 }}>{plan.description}</Text>
          <Text style={{ color: palette.text, fontWeight: '900', fontSize: 28, marginVertical: 16 }}>{formatMoney(plan.price)}</Text>
          {plan.features.map((feature) => <Text key={feature} style={{ color: palette.sub, marginBottom: 6 }}>✓ {feature}</Text>)}
          <Button title={busy ? 'Đang tạo...' : 'Mua ngay'} onPress={() => buy(plan)} palette={palette} disabled={busy} />
        </Card>
      ))}
    </View>
  );
}

function ProfileScreen({ palette, user, subscription, logout, refreshAccount }: { palette: Palette; user: User; subscription: SubscriptionStatus; logout: () => void; refreshAccount: () => Promise<void> }) {
  return (
    <View>
      <SectionTitle title="Tài khoản" subtitle="Cùng tài khoản với JLPT Hub web." palette={palette} />
      <Card palette={palette}>
        <Text style={{ color: palette.text, fontSize: 24, fontWeight: '900' }}>{user.name}</Text>
        <Text style={{ color: palette.sub, marginTop: 4 }}>{user.email}</Text>
        <Text style={{ color: subscription.isVip ? palette.warning : palette.sub, marginTop: 10, fontWeight: '900' }}>
          {user.role === 'admin' ? 'Admin · VIP tự động' : subscription.isVip ? 'VIP đang hoạt động' : 'Học viên thường'}
        </Text>
        <View style={{ height: 12 }} />
        <Button title="Đồng bộ lại tài khoản" onPress={refreshAccount} palette={palette} variant="ghost" />
        <View style={{ height: 10 }} />
        <Button title="Đăng xuất" onPress={logout} palette={palette} variant="danger" />
      </Card>
    </View>
  );
}

function AdminScreen({ palette, user }: { palette: Palette; user: User }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    if (user.role !== 'admin') return;
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        apiFetch<{ stats: AdminStats }>(endpoints.adminStats),
        apiFetch<{ users: User[] }>(`${endpoints.adminUsers}?search=${encodeURIComponent(search)}&limit=20`),
      ]);
      setStats(statsData.stats);
      setUsers(usersData.users);
    } catch (error: any) {
      Alert.alert('Không tải được admin', error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [search]);
  const action = async (path: string, method = 'PUT', body?: object) => {
    await apiFetch(path, { method, body: body ? JSON.stringify(body) : undefined });
    await load();
  };
  if (user.role !== 'admin') return <EmptyState text="Chỉ admin mới xem được màn này." palette={palette} />;
  if (loading) return <Loading palette={palette} />;
  return (
    <View>
      <SectionTitle title="Admin Mobile" subtitle="Quản lý user, VIP, khóa tài khoản và vai trò như bản web." palette={palette} />
      {stats ? (
        <View style={styles.grid2}>
          <Stat palette={palette} label="Users" value={stats.totalUsers} />
          <Stat palette={palette} label="VIP" value={stats.totalVipUsers} />
          <Stat palette={palette} label="Bị khóa" value={stats.bannedUsers} />
          <Stat palette={palette} label="Doanh thu" value={formatMoney(stats.totalRevenue)} />
        </View>
      ) : null}
      <Input palette={palette} placeholder="Tìm user..." value={search} onChangeText={setSearch} />
      {users.map((item: any) => (
        <Card key={item._id || item.id} palette={palette}>
          <Text style={{ color: palette.text, fontWeight: '900' }}>{item.name}</Text>
          <Text style={{ color: palette.sub }}>{item.email}</Text>
          <Text style={{ color: palette.sub, marginTop: 4 }}>{item.role} · {item.isVip ? 'VIP' : 'Thường'} · {item.status || 'active'}</Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            {item.role !== 'admin' ? <Button title={item.isVip ? 'Hủy VIP' : 'Cấp VIP'} onPress={() => action(`/admin/users/${item._id}/vip`)} palette={palette} variant="ghost" /> : null}
            {item.role !== 'admin' ? <Button title={item.status === 'banned' ? 'Mở khóa' : 'Khóa tài khoản'} onPress={() => action(`/admin/users/${item._id}/status`)} palette={palette} variant={item.status === 'banned' ? 'success' : 'danger'} /> : null}
            {item.email !== user.email ? (
              <Button title={item.role === 'admin' ? 'Hạ xuống Student' : 'Nâng lên Admin'} onPress={() => action(`/admin/users/${item._id}/role`, 'PUT', { role: item.role === 'admin' ? 'student' : 'admin' })} palette={palette} variant="ghost" />
            ) : null}
          </View>
        </Card>
      ))}
    </View>
  );
}

function Stat({ palette, label, value }: { palette: Palette; label: string; value: string | number }) {
  return (
    <Card palette={palette}>
      <Text style={{ color: palette.muted, fontSize: 12, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color: palette.text, fontSize: 20, fontWeight: '900', marginTop: 4 }}>{value}</Text>
    </Card>
  );
}

function BottomNav({ palette, tab, setTab, isAdmin }: { palette: Palette; tab: MainTab; setTab: (tab: MainTab) => void; isAdmin: boolean }) {
  const items: { id: MainTab; label: string; icon: string }[] = [
    { id: 'home', label: 'Học', icon: '⌂' },
    { id: 'learn', label: 'Kho', icon: '▤' },
    { id: 'exams', label: 'Đề', icon: '✎' },
    { id: 'notebook', label: 'Sổ', icon: '□' },
    { id: 'pricing', label: 'VIP', icon: '★' },
    { id: 'profile', label: 'Tôi', icon: '●' },
  ];
  if (isAdmin) items.push({ id: 'admin', label: 'Admin', icon: '♛' });
  return (
    <View style={[styles.bottomNav, { backgroundColor: palette.card, borderTopColor: palette.border }]}>
      {items.map((item) => {
        const active = tab === item.id;
        return (
          <Pressable key={item.id} onPress={() => setTab(item.id)} style={styles.navItem}>
            <Text style={{ color: active ? palette.primary : palette.muted, fontSize: 18, fontWeight: '900' }}>{item.icon}</Text>
            <Text style={{ color: active ? palette.primary : palette.muted, fontSize: 10, fontWeight: '800' }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    minHeight: 66,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 22,
    fontWeight: '900',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 18,
    paddingBottom: 110,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  levelRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 16,
  },
  levelPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    minHeight: 72,
    paddingHorizontal: 8,
    paddingTop: 8,
    flexDirection: 'row',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  choice: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
