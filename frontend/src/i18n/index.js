import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations = {
  en: {
    common: {
      appName: 'QuizCraft',
      loading: 'Loading...',
      cancel: 'Cancel',
      save: 'Save',
      logout: 'Logout',
      create: 'Create',
      assign: 'Assign',
      language: 'Language',
      english: 'English',
      bangla: 'বাংলা',
    },
    home: {
      hello: 'Hello',
      ready: 'Ready to learn something new?',
      created: 'Created',
      completed: 'Completed',
      rank: 'Rank',
      exploreQuizzes: 'Explore Quizzes',
      noQuizzesTitle: 'No quizzes yet',
      noQuizzesText: 'Create your first quiz!',
      createQuiz: '+ Create Quiz',
      questions: 'Questions',
      views: 'Views',
      difficultyMixed: 'Mixed',
    },
    upload: {
      generateQuiz: 'Generate Quiz',
      aiPowered: 'AI-Powered Quiz Creation',
      fromText: 'From Text',
      fromFile: 'From File',
      numQuestions: 'Number of Questions',
      chooseFile: 'Choose File',
      uploadAndGenerate: 'Upload & Generate',
      generate: 'Generate',
      enter100: 'Please enter at least 100 characters',
      success: 'Success!',
    },
    profile: {
      role: 'Role',
      logout: 'Logout',
      language: 'Language',
      teacherDashboard: 'Teacher Dashboard',
      adminDashboard: 'Admin Dashboard',
    },
    teacher: {
      myClasses: 'My Classes',
      createClass: 'Create Class',
      className: 'Class Name',
      joinCode: 'Join Code',
      create: 'Create',
      assignToClass: 'Assign to Class',
      joinClass: 'Join Class',
      classDetails: 'Class Details',
      students: 'Students',
      assignedQuizzes: 'Assigned Quizzes'
    },
    login: {
      title: 'Welcome Back',
      subtitle: 'Sign in to continue',
      email: 'Email',
      password: 'Password',
      signIn: 'Login',
      continueGuest: 'Continue as Guest',
      prompt: "Don't have an account?",
      signup: 'Sign Up',
      fullName: 'Full Name',
      confirmPassword: 'Confirm Password',
      joinToday: 'Join QuizCraft today',
      iAmA: 'I am a:',
      student: 'Student',
      teacher: 'Teacher',
      alreadyHaveAccount: 'Already have an account?'
    },
    quiz: {
      start: 'Start Quiz',
      assign: 'Assign to Class',
      share: 'Share',
      category: 'Category',
      difficulty: 'Difficulty',
      questions: 'Questions'
    },
    subscription: {
      title: 'Subscription',
      current: 'Current',
      premium: 'Premium',
      institutional: 'Institutional',
      upgrade: 'Upgrade'
    },
    analytics: {
      history: 'History',
      stats: 'My Statistics',
      leaderboard: 'Leaderboard',
      score: 'Score',
      attempts: 'Attempts',
      avgScore: 'Average Score',
      passRate: 'Pass Rate',
      averageTime: 'Average Time'
    },
    admin: {
      users: 'Users',
      quizzes: 'Quizzes',
      activity: 'Activity',
      search: 'Search',
      role: 'Role',
      status: 'Status',
      page: 'Page',
      next: 'Next',
      prev: 'Prev',
      filter: 'Filter',
      name: 'Name',
      email: 'Email',
      createdAt: 'Created',
      public: 'Public',
      from: 'From',
      to: 'To',
      subscription: 'Subscription',
      isActive: 'Active',
      title: 'Title'
    }
  },
  bn: {
    common: {
      appName: 'কুইজক্রাফ্ট',
      loading: 'লোড হচ্ছে...',
      cancel: 'বাতিল',
      save: 'সংরক্ষণ',
      logout: 'লগ আউট',
      create: 'তৈরি করুন',
      assign: 'বরাদ্দ দিন',
      language: 'ভাষা',
      english: 'English',
      bangla: 'বাংলা',
    },
    home: {
      hello: 'স্বাগতম',
      ready: 'নতুন কিছু শিখতে প্রস্তুত?',
      created: 'তৈরি',
      completed: 'সম্পন্ন',
      rank: 'র‍্যাংক',
      exploreQuizzes: 'কুইজসমূহ দেখুন',
      noQuizzesTitle: 'এখনও কোন কুইজ নেই',
      noQuizzesText: 'আপনার প্রথম কুইজটি তৈরি করুন!',
      createQuiz: '+ কুইজ তৈরি করুন',
      questions: 'প্রশ্ন',
      views: 'ভিউ',
      difficultyMixed: 'মিশ্র',
    },
    upload: {
      generateQuiz: 'কুইজ তৈরি করুন',
      aiPowered: 'এআই দ্বারা কুইজ প্রস্তুত',
      fromText: 'টেক্সট থেকে',
      fromFile: 'ফাইল থেকে',
      numQuestions: 'প্রশ্নের সংখ্যা',
      chooseFile: 'ফাইল বাছাই করুন',
      uploadAndGenerate: 'আপলোড ও তৈরি করুন',
      generate: 'তৈরি করুন',
      enter100: 'অনুগ্রহ করে কমপক্ষে ১০০ অক্ষর লিখুন',
      success: 'সফল!',
    },
    profile: {
      role: 'ভূমিকা',
      logout: 'লগ আউট',
      language: 'ভাষা',
      teacherDashboard: 'শিক্ষক ড্যাশবোর্ড',
      adminDashboard: 'অ্যাডমিন ড্যাশবোর্ড',
    },
    teacher: {
      myClasses: 'আমার ক্লাসসমূহ',
      createClass: 'ক্লাস তৈরি করুন',
      className: 'ক্লাসের নাম',
      joinCode: 'জয়েন কোড',
      create: 'তৈরি করুন',
      assignToClass: 'ক্লাসে বরাদ্দ দিন',
      joinClass: 'ক্লাসে যোগ দিন',
      classDetails: 'ক্লাসের বিবরণ',
      students: 'শিক্ষার্থীরা',
      assignedQuizzes: 'বরাদ্দকৃত কুইজ'
    },
    login: {
      title: 'পুনরায় স্বাগতম',
      subtitle: 'চালিয়ে যেতে সাইন ইন করুন',
      email: 'ইমেইল',
      password: 'পাসওয়ার্ড',
      signIn: 'লগইন',
      continueGuest: 'গেস্ট হিসেবে চালিয়ে যান',
      prompt: 'অ্যাকাউন্ট নেই? ',
      signup: 'সাইন আপ',
      fullName: 'পূর্ণ নাম',
      confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
      joinToday: 'আজই কুইজক্রাফ্টে যোগ দিন',
      iAmA: 'আমি একজন:',
      student: 'ছাত্র/ছাত্রী',
      teacher: 'শিক্ষক',
      alreadyHaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?'
    },
    quiz: {
      start: 'কুইজ শুরু করুন',
      assign: 'ক্লাসে বরাদ্দ দিন',
      share: 'শেয়ার',
      category: 'বিভাগ',
      difficulty: 'কঠিনতা',
      questions: 'প্রশ্ন'
    },
    subscription: {
      title: 'সাবস্ক্রিপশন',
      current: 'বর্তমান',
      premium: 'প্রিমিয়াম',
      institutional: 'ইনস্টিটিউশনাল',
      upgrade: 'আপগ্রেড'
    },
    analytics: {
      history: 'ইতিহাস',
      stats: 'আমার পরিসংখ্যান',
      leaderboard: 'লিডারবোর্ড',
      score: 'স্কোর',
      attempts: 'চেষ্টা',
      avgScore: 'গড় স্কোর',
      passRate: 'পাস হার',
      averageTime: 'গড় সময়'
    },
    admin: {
      users: 'ব্যবহারকারীরা',
      quizzes: 'কুইজসমূহ',
      activity: 'সক্রিয়তা',
      search: 'খোঁজ',
      role: 'ভূমিকা',
      status: 'অবস্থা',
      page: 'পৃষ্ঠা',
      next: 'পরবর্তী',
      prev: 'পূর্ববর্তী',
      filter: 'ফিল্টার',
      name: 'নাম',
      email: 'ইমেইল',
      createdAt: 'তৈরির তারিখ',
      public: 'পাবলিক',
      from: 'শুরু',
      to: 'শেষ',
      subscription: 'সাবস্ক্রিপশন',
      isActive: 'সক্রিয়',
      title: 'শিরোনাম'
    }
  }
};

const I18nContext = createContext({ t: (k)=>k, lang: 'en', setLang: ()=>{} });
export const useI18n = () => useContext(I18nContext);

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('lang');
      if (saved) setLangState(saved);
    })();
  }, []);

  const setLang = async (l) => {
    setLangState(l);
    await AsyncStorage.setItem('lang', l);
  };

  const t = (key) => {
    const [ns, k] = key.includes(':') ? key.split(':') : ['common', key];
    return translations[lang]?.[ns]?.[k] || translations.en?.[ns]?.[k] || key;
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
};
