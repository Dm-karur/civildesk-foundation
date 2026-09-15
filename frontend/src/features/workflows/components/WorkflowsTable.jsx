import { useState, useRef, useEffect } from 'react';
import { Eye, Edit, MoreVertical, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';

export function WorkflowsTable({ 
  workflows,
  onView,
  onEdit,
  onDelete,
  onToggleStatus
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderPagination = () => (
    <Pagination 
      currentPage={1}
      totalPages={1}
      totalItems={workflows.length}
      itemsPerPage={10}
      onPageChange={() => {}}
      onItemsPerPageChange={() => {}}
    />
  );

  return (
    <DataTableContainer pagination={renderPagination()}>
      <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed border-collapse">
        <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
          <tr>
            <th className="px-3 py-2 w-12 text-center">#</th>
            <th className="px-3 py-2 w-48">Workflow Name</th>
            <th className="px-3 py-2 w-40">System Module</th>
            <th className="px-3 py-2 w-32">Transaction</th>
            <th className="px-3 py-2 w-28 text-center">Levels</th>
            <th className="px-3 py-2 w-28">Scope</th>
            <th className="px-3 py-2 min-w-[200px]">Approval Flow</th>
            <th className="px-3 py-2 w-24 text-center">Status</th>
            <th className="px-3 py-2 w-24 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {workflows.length === 0 ? (
            <tr>
              <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                No workflows match the selected filters.
              </td>
            </tr>
          ) : (
            workflows.map((wf, index) => {
              const isActive = wf.status === 'Active';
              const isMenuOpen = openMenuId === wf.id;

              return (
                <tr key={wf.id} className="hover:bg-surface-muted/30 transition-colors group relative">
                  <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">{index + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-text-primary truncate" title={wf.name}>{wf.name}</span>
                      <span className="text-[10px] text-text-secondary font-mono mt-0.5">{wf.code}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-text-secondary truncate text-[11px]" title={wf.module}>
                    {wf.module}
                  </td>
                  <td className="px-3 py-2 text-text-secondary truncate text-[11px]" title={wf.transaction}>
                    {wf.transaction}
                  </td>
                  <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                    {wf.levels} Levels
                  </td>
                  <td className="px-3 py-2 text-text-secondary text-[11px]">
                    {wf.scope}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center flex-wrap gap-1">
                      {wf.flow.map((step, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="bg-surface border border-border px-1.5 py-0.5 rounded text-[10px] text-text-primary font-medium whitespace-nowrap">
                            {step.role}
                          </span>
                          {i < wf.flow.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge 
                      variant={isActive ? 'success' : 'neutral'}
                      className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center gap-0.5"
                    >
                      {isActive ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onView(wf)}
                        className="h-6 w-6 p-0" 
                        title="View Workflow"
                      >
                        <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onEdit(wf)}
                        className="h-6 w-6 p-0" 
                        title="Edit Workflow"
                      >
                        <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                      </Button>

                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : wf.id);
                          }}
                          className={`h-6 w-6 p-0 ${isMenuOpen ? 'text-primary bg-surface-muted' : 'text-text-secondary'}`}
                          title="More Options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>

                        {isMenuOpen && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 top-7 z-50 w-36 bg-surface border border-border rounded-sm shadow-xl p-1 text-[11px] animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              onClick={() => {
                                onView(wf);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              <span>View Details</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                onEdit(wf);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary" />
                              <span>Edit Workflow</span>
                            </button>

                            <button
                              onClick={() => {
                                onToggleStatus(wf);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                            >
                              {isActive ? <XCircle className="w-3.5 h-3.5 text-amber-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                              <span>{isActive ? 'Mark Inactive' : 'Mark Active'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </DataTableContainer>
  );
}
