import React from 'react';
import { FileText, Link2, Video, FileEdit, Trash2 } from 'lucide-react';

const TYPE_CONFIG = {
  PDF: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10' },
  LINK: { icon: Link2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  VIDEO: { icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  NOTE: { icon: FileEdit, color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
};

const MaterialCard = ({ material, onEdit, onDelete, isAdmin }) => {
  const { icon: Icon, color, bg } = TYPE_CONFIG[material.type] || TYPE_CONFIG.LINK;

  return (
    <div className="glass-card flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg ${bg} shrink-0`}>
          <Icon size={20} className={color} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm leading-tight truncate">{material.title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {material.subject?.name} {material.batch ? `· ${material.batch.name}` : ''}
          </p>
          {material.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{material.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <a
          href={material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-light hover:text-brand font-medium transition-colors"
        >
          Open Resource →
        </a>

        <div className="flex gap-1.5">
          {onEdit && (
            <button
              onClick={() => onEdit(material)}
              className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors"
              title="Edit"
            >
              <FileEdit size={13} />
            </button>
          )}
          {isAdmin && onDelete && (
            <button
              onClick={() => onDelete(material.id)}
              className="p-1.5 rounded bg-status-danger/10 hover:bg-status-danger text-status-danger hover:text-white transition-colors"
              title="Remove"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialCard;
