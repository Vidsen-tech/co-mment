import React, { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
    isOpen: boolean
    onClose: () => void
    title: string
    children: ReactNode
}

export default function AppModal({ isOpen, onClose, title, children }: Props) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-black/60"
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative z-10 w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg overflow-auto max-h-full"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        <header className="px-4 py-2 border-b dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-lg font-semibold">{title}</h2>
                            <button onClick={onClose} className="text-2xl leading-none">&times;</button>
                        </header>
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
