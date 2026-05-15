```react
import React, { useState, useEffect } from 'react';
import { Gift, Check, Sparkles, History, Heart, CreditCard, X, User, Lock, Loader2, Settings } from 'lucide-react';
import { collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const [appState, setAppState] = useState('initial_loading');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authForm, setAuthForm] = useState({ id: '', password: '', name: '' });
  
  const [adminModal, setAdminModal] = useState({ show: false, step: 'password', password: '' });

  const [careCount, setCareCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rewardModal, setRewardModal] = useState({ show: false, amount: 0 });
  const [toastMessage, setToastMessage] = useState('');

  const TARGET_COUNT = 10;
  
  useEffect(() => {
    if (appState === 'initial_loading') {
      const timer = setTimeout(() => {
        setAppState('login');
      }, 3500);
      return () => clearTimeout(timer);
    } else if (appState === 'loading') {
      const timer = setTimeout(() => {
        setAppState('main');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [appState]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'muri_users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      
      if (!userList.find(u => u.id === 'gguru1081')) {
        setDoc(doc(db, 'muri_users', 'gguru1081'), {
          password: 'djslzja1!',
          name: '관리자',
          status: 'approved',
          role: 'admin'
        });
      }
    });

    const unsubData = onSnapshot(doc(db, 'muri_system', 'appData'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCareCount(data.careCount || 0);
        setTotalPoints(data.totalPoints || 0);
        setHistory(data.history || []);
      } else {
        setDoc(doc(db, 'muri_system', 'appData'), { careCount: 0, totalPoints: 0, history: [] });
      }
    });

    return () => {
      unsubUsers();
      unsubData();
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = () => {
    if (!authForm.id || !authForm.password) {
      return showToast("아이디와 비밀번호를 입력해주세요.");
    }

    const user = users.find(u => u.id === authForm.id && u.password === authForm.password);
    
    if (!user) {
      return showToast("아이디 또는 비밀번호가 틀렸습니다.");
    }
    
    if (user.status === 'pending') {
      return showToast("가입 승인 대기 중입니다. 관리자에게 문의하세요.");
    }

    setIsLoggingIn(true);
    setCurrentUser(user);
    
    setTimeout(() => {
      setIsLoggingIn(false);
      setAppState('loading');
    }, 1000);
  };

  const handleRegisterSubmit = async () => {
    if (!authForm.id || !authForm.password || !authForm.name) {
      return showToast("모든 정보를 입력해주세요.");
    }
    
    if (users.some(u => u.id === authForm.id)) {
      return showToast("이미 존재하는 아이디입니다.");
    }

    await setDoc(doc(db, 'muri_users', authForm.id), {
      password: authForm.password,
      name: authForm.name,
      status: 'pending',
      role: 'viewer'
    });

    showToast("가입 요청이 완료되었습니다. 승인을 기다려주세요.");
    setIsRegisterMode(false);
    setAuthForm({ id: '', password: '', name: '' });
  };

  const handleAdminAuth = () => {
    if (adminModal.password === 'djslzja1324!') {
      setAdminModal({ ...adminModal, step: 'list' });
    } else {
      showToast("관리자 비밀번호가 틀렸습니다.");
    }
  };

  const approveUser = async (userId) => {
    await updateDoc(doc(db, 'muri_users', userId), { status: 'approved' });
    showToast("가입이 승인되었습니다.");
  };

  const handleCareComplete = async () => {
    if (currentUser?.role !== 'admin') {
      return showToast("보기 전용(뷰어) 계정입니다. 관리자만 조작할 수 있어요.");
    }

    if (careCount >= TARGET_COUNT) {
      showToast("이미 10회를 달성했어요! 선물을 뽑아주세요. 🎁");
      return;
    }

    const newCount = careCount + 1;
    const newLog = {
      id: Date.now(),
      type: 'care',
      title: '메디헤어 케어 완료',
      date: new Date().toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    
    await updateDoc(doc(db, 'muri_system', 'appData'), {
      careCount: newCount,
      history: [newLog, ...history]
    });

    showToast("참 잘했어요! (" + newCount + "/" + TARGET_COUNT + ") 💖");
  };

  const drawPrize = () => {
    const rand = Math.random();
    if (rand < 0.6) return 10000;
    if (rand < 0.9) return 50000;
    return 100000;
  };

  const handleDraw = () => {
    if (currentUser?.role !== 'admin') {
      return showToast("보기 전용(뷰어) 계정입니다. 관리자만 조작할 수 있어요.");
    }

    if (careCount < TARGET_COUNT) return;
    
    setIsDrawing(true);
    
    setTimeout(async () => {
      const amount = drawPrize();
      const newLog = {
        id: Date.now(),
        type: 'reward',
        title: '🎉 보상 당첨!',
        amount: amount,
        date: new Date().toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
      
      await updateDoc(doc(db, 'muri_system', 'appData'), {
        totalPoints: totalPoints + amount,
        careCount: 0,
        history: [newLog, ...history]
      });
      
      setIsDrawing(false);
      setRewardModal({ show: true, amount: amount });
    }, 1500);
  };

  const StampBoard = () => {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
        
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-sm text-pink-400 font-medium mb-1">케어 스탬프</p>
            <h3 className="text-xl font-bold text-gray-800">
              <span className="text-pink-500">{careCount}</span> / {TARGET_COUNT}
            </h3>
          </div>
          {careCount === TARGET_COUNT && (
            <div className="animate-bounce bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <Gift size={14} /> 보상 가능!
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: TARGET_COUNT }).map((_, index) => {
            const isFilled = index < careCount;
            const isLast = index === TARGET_COUNT - 1;
            
            return (
              <div 
                key={index}
                className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl transition-all duration-500 ${
                  isFilled 
                    ? 'bg-gradient-to-br from-pink-400 to-rose-400 shadow-md shadow-pink-200 scale-100' 
                    : 'bg-gray-50 border border-gray-100 scale-95'
                }`}
              >
                {isFilled ? (
                  <Check className="text-white w-6 h-6 animate-in zoom-in" strokeWidth={3} />
                ) : isLast ? (
                  <Gift className="text-pink-200 w-6 h-6" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-5 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pink-300 to-rose-400 transition-all duration-700 ease-out"
            style={{ width: `${(careCount / TARGET_COUNT) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start font-sans">
      <div className="w-full max-w-md min-h-screen bg-[#FAFAFA] relative shadow-2xl overflow-hidden flex flex-col">
        
        {appState === 'login' && (
          <div className="absolute inset-0 z-40 bg-[#FAFAFA] flex flex-col justify-center px-8 overflow-hidden animate-in fade-in duration-700">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-pink-100/60 to-transparent -z-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100/40 rounded-full blur-3xl -mr-20 -mt-20 -z-10"></div>
            
            <button 
              onClick={() => setAdminModal({ show: true, step: 'password', password: '' })}
              className="absolute top-6 right-6 text-gray-400 hover:text-pink-500 transition-colors p-2"
            >
              <Settings size={24} />
            </button>

            <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-400 mb-3">
                MURI
              </h1>
              <p className="text-gray-500 text-sm font-medium">프리미엄 케어 라운지</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  name="id"
                  placeholder="아이디"
                  value={authForm.id}
                  onChange={handleAuthInputChange}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all font-medium" 
                />
              </div>
              
              {isRegisterMode && (
                <div className="relative group animate-in slide-in-from-top-2 fade-in duration-200">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    name="name"
                    placeholder="이름"
                    value={authForm.name}
                    onChange={handleAuthInputChange}
                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all font-medium" 
                  />
                </div>
              )}

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  name="password"
                  placeholder="비밀번호"
                  value={authForm.password}
                  onChange={handleAuthInputChange}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all" 
                />
              </div>
              
              <button 
                onClick={isRegisterMode ? handleRegisterSubmit : handleLoginSubmit} 
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold py-4 rounded-2xl mt-6 hover:from-gray-800 hover:to-gray-700 active:scale-95 transition-all shadow-xl shadow-gray-200 flex justify-center items-center gap-2"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : (isRegisterMode ? '가입 신청하기' : '입장하기')}
              </button>

              <div className="text-center mt-4">
                <button 
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setAuthForm({ id: '', password: '', name: '' });
                  }}
                  className="text-sm text-gray-400 hover:text-pink-500 font-medium transition-colors"
                >
                  {isRegisterMode ? '이미 계정이 있으신가요? 로그인' : '처음이신가요? 가입하기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {(appState === 'loading' || appState === 'initial_loading') && (
          <div className="absolute inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-900/40 via-gray-900 to-rose-900/30 animate-cinematic-bg mix-blend-screen"></div>
            
            <div className="z-10 flex flex-col items-center animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-400 to-rose-300 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,114,182,0.4)] animate-pulse-slow">
                <Heart size={32} className="text-white" fill="currentColor" />
              </div>
              <h1 className="text-5xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-100 via-white to-pink-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                MURI
              </h1>
              <p className="mt-4 text-pink-200/60 tracking-[0.3em] text-xs font-light">
                PREMIUM CARE LOUNGE
              </p>
            </div>

            <Sparkles className="absolute top-1/4 right-1/4 text-pink-300/30 animate-ping" size={20} />
            <Sparkles className="absolute bottom-1/3 left-1/4 text-rose-300/30 animate-pulse-slow" size={24} />
          </div>
        )}

        {appState === 'main' && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-rose-100 via-pink-50 to-[#FAFAFA] -z-10"></div>
            
            <header className="px-6 pt-12 pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-400">
                  MURI
                </h1>
                <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1">
                  <Sparkles size={12} className="text-pink-400" /> 
                  {currentUser?.role === 'admin' ? '관리자 모드' : '프리미엄 케어'}
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-pink-100 flex items-center justify-center p-1">
                <div className="w-full h-full bg-pink-50 rounded-full flex items-center justify-center text-pink-500">
                  <Heart size={20} fill="currentColor" />
                </div>
              </div>
            </header>

            <main className="flex-1 px-6 pb-24 overflow-y-auto hide-scrollbar">
              <div className="mb-8 mt-2">
                <h2 className="text-2xl font-bold text-gray-800 leading-snug">
                  오늘도 예쁜 {currentUser?.name || '회원'}님,<br />
                  <span className="text-pink-500">풍성한 하루</span> 되세요!
                </h2>
                
                <div className="mt-6 bg-gray-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  <p className="text-gray-400 text-sm font-medium mb-1 flex items-center gap-2">
                    <CreditCard size={16} /> 획득한 총 지원금
                  </p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-3xl font-bold">
                      {totalPoints.toLocaleString()}
                    </h3>
                    <span className="text-gray-400 font-medium pb-1">원</span>
                  </div>
                </div>
              </div>

              <StampBoard />

              <div className="mb-4">
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <History size={16} /> 최근 기록
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-sm shadow-sm border border-gray-100">
                      아직 기록이 없어요.<br/>첫 케어를 시작해볼까요?
                    </div>
                  ) : (
                    history.slice(0, 3).map((log) => (
                      <div key={log.id} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            log.type === 'reward' ? 'bg-pink-100 text-pink-500' : 'bg-gray-50 text-gray-400'
                          }`}>
                            {log.type === 'reward' ? <Gift size={18} /> : <Check size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{log.title}</p>
                            <p className="text-xs text-gray-400">{log.date}</p>
                          </div>
                        </div>
                        {log.amount && (
                          <span className="text-sm font-extrabold text-pink-500">
                            +{log.amount.toLocaleString()}원
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </main>

            <div className="absolute bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-100 p-6 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
              {careCount < TARGET_COUNT ? (
                <button 
                  onClick={handleCareComplete}
                  className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-gray-900 hover:bg-gray-800 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} /> 메디헤어 케어 완료!
                </button>
              ) : (
                <button 
                  onClick={handleDraw}
                  disabled={isDrawing}
                  className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 transition-all shadow-lg shadow-pink-200 flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  {isDrawing ? (
                    <span className="animate-pulse">두근두근 뽑기 중...</span>
                  ) : (
                    <>
                      <Gift size={20} /> 보상 뽑기! (남편 찬스)
                    </>
                  )}
                </button>
              )}
            </div>

            {rewardModal.show && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRewardModal({ show: false, amount: 0 })}></div>
                <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                  <button 
                    onClick={() => setRewardModal({ show: false, amount: 0 })}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                  
                  <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-500">
                    <Gift size={48} className="animate-bounce" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">축하합니다!</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    남편의 지갑에서 성공적으로 출금되었습니다.
                  </p>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-2">당첨 금액</p>
                    <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-400">
                      {rewardModal.amount.toLocaleString()}원
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => setRewardModal({ show: false, amount: 0 })}
                    className="w-full py-4 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {adminModal.show && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAdminModal({ show: false, step: 'password', password: '' })}></div>
            <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setAdminModal({ show: false, step: 'password', password: '' })}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-xl font-bold text-gray-800 mb-6">관리자 메뉴</h3>
              
              {adminModal.step === 'password' ? (
                <div>
                  <p className="text-gray-500 text-sm mb-4">관리자 권한 암호를 입력해주세요.</p>
                  <input 
                    type="password" 
                    value={adminModal.password}
                    onChange={(e) => setAdminModal({ ...adminModal, password: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-pink-400 mb-4 text-center" 
                  />
                  <button 
                    onClick={handleAdminAuth}
                    className="w-full py-3 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800"
                  >
                    확인
                  </button>
                </div>
              ) : (
                <div className="text-left">
                  <p className="text-gray-500 text-sm mb-4 font-medium">가입 대기 목록</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto hide-scrollbar">
                    {users.filter(u => u.status === 'pending').length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-4">대기 중인 사용자가 없습니다.</p>
                    ) : (
                      users.filter(u => u.status === 'pending').map(u => (
                        <div key={u.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.id}</p>
                          </div>
                          <button 
                            onClick={() => approveUser(u.id)}
                            className="bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-pink-200 transition-colors"
                          >
                            승인
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {toastMessage && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl text-sm font-medium z-[70] animate-in slide-in-from-top-5 fade-in whitespace-nowrap">
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
}


```
