import React, { useState, useMemo } from 'react';
import { Modal } from '../../components/ui/Modal/Modal';
import { Button } from '../../components/ui/Button/Button';
import { useCourseAssignment } from '../../hooks/tenant/useCourseAssignment';

export interface BrowseCoursesModalProps {
    open: boolean;
    onClose: () => void;
}

const BrowseCoursesModal: React.FC<BrowseCoursesModalProps> = ({ open, onClose }) => {
    const { store, contentOptions, filterOptions } = useCourseAssignment();
    const [search, setSearch] = useState('');

    const filteredOptions = useMemo(() => {
        if (!search) return contentOptions;
        return contentOptions.filter((opt: any) => 
            opt.title?.toLowerCase().includes(search.toLowerCase())
        );
    }, [contentOptions, search]);

    const handleToggle = (opt: any) => {
        store.toggleSelectedContent({
            id: opt.id,
            type: opt.contentType,
            title: opt.title || ''
        });
    };

    const isSelected = (id: string) => {
        return store.selectedContents.some((c) => c.id === id);
    };

    const typeLabel = 'courses & career paths';

    const formatDifficulty = (difficulty?: string) => {
        if (!difficulty) return 'Beginner';
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    };

    const renderGridItem = (opt: any) => {
        const selected = isSelected(opt.id);
        
        return (
            <button 
                type="button"
                key={opt.id}
                onClick={() => handleToggle(opt)}
                className={`flex items-center text-left p-3 rounded-xl border cursor-pointer transition-all ${
                    selected ? 'bg-[#eef5e6] border-[#8cb071]' : 'bg-white border-[#e5e7eb] hover:border-[#d1d5db]'
                }`}
            >
                <div className="w-14 h-10 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden border border-black/5 mr-3">
                    {opt.coverImageUrl || opt.thumbnailUrl ? (
                        <img src={opt.coverImageUrl || opt.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                        </div>
                    )}
                </div>
                <div className="flex flex-col flex-1">
                    <span className="text-[15px] font-semibold text-[#111827] leading-tight line-clamp-1">{opt.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[13px] text-[#6b7280] line-clamp-1">{formatDifficulty(opt.difficulty)} · {opt.duration ? opt.duration : '30 min'}</span>
                        {opt.contentType === 'CAREER_PATH' && (
                            <span className="text-[10px] font-bold tracking-wider uppercase text-[#8f3a20] bg-[#efd3c7] px-1.5 py-0.5 rounded-sm shrink-0">Career Path</span>
                        )}
                    </div>
                </div>
                <span className="flex-shrink-0 ml-3 flex items-center justify-center text-[#6b7280]">
                    {selected ? (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#65a30d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    )}
                </span>
            </button>
        );
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            className="max-w-[700px] shadow-2xl !bg-white"
            contentClassName="p-0 bg-white overflow-hidden flex flex-col"
        >
            {/* Custom Header */}
            <div className="flex items-start justify-between w-full px-6 pt-6 pb-4 border-b border-[#f3f4f6]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[18px] font-bold text-[#111827]">Browse {typeLabel}</h2>
                    <span className="text-[14px] text-[#6b7280] font-normal">{store.selectedContents.length} of {contentOptions.length} selected</span>
                </div>
                <button onClick={onClose} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Custom Body */}
            <div className="p-6">
                <div className="relative mb-4">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input 
                        type="text"
                        placeholder={`Search ${typeLabel}...`}
                        className="w-full h-[46px] pl-[38px] pr-4 border border-[#e5e7eb] rounded-lg text-[15px] outline-none focus:border-[#9ca3af] focus:ring-1 focus:ring-[#9ca3af] transition-all placeholder:text-[#9ca3af]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Modal Filters */}
                <div className="mb-5 bg-[#f9fafb] p-4 rounded-xl border border-[#e5e7eb]">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[13px] font-semibold text-[#4b5563]">Filter Options</span>
                        {(store.subject || store.category || store.tag || store.difficulty) && (
                            <button onClick={store.clearFilters} className="text-[12px] font-bold text-[#c29c38] hover:text-[#967323] transition-colors">
                                Clear filters
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <select 
                            className="w-full h-9 px-3 border border-[#d1d5db] rounded-md text-[14px] text-[#374151] bg-white outline-none focus:border-[#9ca3af]"
                            value={store.subject}
                            onChange={(e) => store.setSubject(e.target.value)}
                        >
                            <option value="">All subjects</option>
                            {filterOptions.subjects.map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                        <select 
                            className="w-full h-9 px-3 border border-[#d1d5db] rounded-md text-[14px] text-[#374151] bg-white outline-none focus:border-[#9ca3af]"
                            value={store.category}
                            onChange={(e) => store.setCategory(e.target.value)}
                        >
                            <option value="">All categories</option>
                            {filterOptions.categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <select 
                            className="w-full h-9 px-3 border border-[#d1d5db] rounded-md text-[14px] text-[#374151] bg-white outline-none focus:border-[#9ca3af]"
                            value={store.tag}
                            onChange={(e) => store.setTag(e.target.value)}
                        >
                            <option value="">All tags</option>
                            {filterOptions.tags.map((tag: string) => <option key={tag} value={tag}>{tag}</option>)}
                        </select>
                        <select 
                            className="w-full h-9 px-3 border border-[#d1d5db] rounded-md text-[14px] text-[#374151] bg-white outline-none focus:border-[#9ca3af]"
                            value={store.difficulty}
                            onChange={(e) => store.setDifficulty(e.target.value)}
                        >
                            <option value="">All levels</option>
                            {filterOptions.difficulties?.map((diff: string) => (
                                <option key={diff} value={diff}>
                                    {diff.charAt(0) + diff.slice(1).toLowerCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-3">
                        <input 
                            type="text"
                            placeholder="Search by skill (e.g. data quality)" 
                            className="w-full h-9 px-3 border border-[#d1d5db] rounded-md text-[14px] text-[#374151] bg-white outline-none focus:border-[#9ca3af] placeholder:text-[#9ca3af]"
                            value={store.skillSearch}
                            onChange={(e) => store.setSkillSearch(e.target.value)}
                            list="modal-skills-list"
                        />
                        <datalist id="modal-skills-list">
                            {filterOptions.skills?.map((skill: string) => (
                                <option key={skill} value={skill} />
                            ))}
                        </datalist>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pb-4 pr-1 scrollbar-thin">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(renderGridItem)
                    ) : (
                        <div className="col-span-2 text-center text-[#6b7280] py-12">
                            No {typeLabel} found matching your search and filters.
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Footer */}
            <div className="flex items-center justify-between w-full px-6 py-4 border-t border-[#f3f4f6]">
                <span className="text-[14px] text-[#4b5563] font-medium">
                    {store.selectedContents.length} {typeLabel} selected
                </span>
                <Button onClick={onClose} className="rounded-full px-6 h-10 text-[14px] font-semibold bg-[#fef08a] text-black hover:bg-[#fde047] border-0 transition-all hover:-translate-y-0.5">
                    Done
                </Button>
            </div>
        </Modal>
    );
};

export default BrowseCoursesModal;
