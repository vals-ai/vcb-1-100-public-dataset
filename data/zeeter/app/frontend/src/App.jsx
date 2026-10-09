import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PostSkeleton } from './components/ui/skeleton'
import { useAuth } from './hooks/useAuth'
const Home=lazy(()=>import('./pages/Home'));const Login=lazy(()=>import('./pages/Login'));const Signup=lazy(()=>import('./pages/Signup'));const Profile=lazy(()=>import('./pages/Profile'));const PostDetail=lazy(()=>import('./pages/PostDetail'));const Notifications=lazy(()=>import('./pages/Notifications'));const ProfileSettings=lazy(()=>import('./pages/ProfileSettings'));const NotFound=lazy(()=>import('./pages/NotFound'))
function Protected({children}){const{user,loading}=useAuth();if(loading)return <div className="mx-auto max-w-2xl"><PostSkeleton/></div>;return user?children:<Navigate to="/login" replace/>}
export default function App(){return <Suspense fallback={<div className="mx-auto mt-8 max-w-2xl"><PostSkeleton/></div>}><Routes><Route element={<Layout/>}><Route index element={<Home/>}/><Route path="login" element={<Login/>}/><Route path="signup" element={<Signup/>}/><Route path="u/:username" element={<Profile/>}/><Route path="p/:id" element={<PostDetail/>}/><Route path="notifications" element={<Protected><Notifications/></Protected>}/><Route path="settings/profile" element={<Protected><ProfileSettings/></Protected>}/><Route path="*" element={<NotFound/>}/></Route></Routes></Suspense>}
