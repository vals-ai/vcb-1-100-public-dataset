import { Link } from 'react-router-dom'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'
export function InteractionPrompt({ open, onClose, action = 'interact' }) { return <Dialog open={open} onClose={onClose} title={`Sign in to ${action}`} description="Join the conversation and connect with people on Zeeter."><div className="flex gap-3"><Button className="flex-1" onClick={onClose}><Link to="/login">Sign in</Link></Button><Button className="flex-1" variant="outline" onClick={onClose}><Link to="/signup">Create account</Link></Button></div></Dialog> }
