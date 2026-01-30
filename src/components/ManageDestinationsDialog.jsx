'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../shadcn/components/ui/dialog';
import { Button } from '../../shadcn/components/ui/button';
import { Label } from '../../shadcn/components/ui/label';
import AsyncSelect from 'react-select/async';

import {
  Reorder,
  useDragControls,
  useMotionValue,
  motion,
  animate,
} from 'motion/react';

import { MapPin, GripVertical, X } from 'lucide-react';

/* ======================================================
   SHARED MANAGE DESTINATIONS DIALOG
====================================================== */

export default function ManageDestinationsDialog({
  destinationDialog,
  setDestinationDialog,
  currentSaleForDialog,
  updateSale,
  removeDestination,
  loadDestinationOptions,
}) {
  return (
    <Dialog
      open={destinationDialog.open}
      onOpenChange={(open) =>
        setDestinationDialog({ open, saleId: null })
      }
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Manage Destinations
          </DialogTitle>
        </DialogHeader>

        {currentSaleForDialog && (
          <div className="space-y-4">
            {/* ======================
                ADD DESTINATION
            ====================== */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Add Destination
              </Label>

              <AsyncSelect
                cacheOptions
                defaultOptions={false}
                loadOptions={loadDestinationOptions}
                value={null}
                onChange={(selected) => {
                  if (!selected) return;

                  updateSale(
                    currentSaleForDialog.id,
                    'destinations',
                    [
                      ...(currentSaleForDialog.destinations || []),
                      selected,
                    ],
                  );
                }}
                placeholder="Type to search (e.g., LHR, DXB, RUH)..."
                menuPortalTarget={document.body}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: 40,
                    borderColor: state.isFocused
                      ? '#3b82f6'
                      : '#e5e7eb',
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
                noOptionsMessage={({ inputValue }) =>
                  inputValue.length < 2
                    ? 'Type at least 2 characters'
                    : 'No destinations found'
                }
              />
            </div>

            {/* ======================
                DESTINATIONS LIST
            ====================== */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Selected Destinations (
                {currentSaleForDialog.destinations?.length || 0})
              </Label>

              {currentSaleForDialog.destinations?.length > 0 ? (
                <Reorder.Group
                  axis="y"
                  values={currentSaleForDialog.destinations}
                  onReorder={(newOrder) =>
                    updateSale(
                      currentSaleForDialog.id,
                      'destinations',
                      newOrder,
                    )
                  }
                  className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-slate-50"
                >
                  {currentSaleForDialog.destinations.map((dest) => (
                    <DestinationItem
                      key={dest.value}
                      dest={dest}
                      onRemove={() =>
                        removeDestination(
                          currentSaleForDialog.id,
                          dest.value,
                        )
                      }
                    />
                  ))}
                </Reorder.Group>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-lg">
                  No destinations added yet
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ======================================================
   DRAGGABLE DESTINATION ITEM
====================================================== */

function DestinationItem({ dest, onRemove }) {
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);
  const dragControls = useDragControls();
  const [active, setActive] = useState(false);

  return (
    <Reorder.Item
      value={dest}
      style={{ y, boxShadow }}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => setActive(true)}
      onDragEnd={() => setActive(false)}
      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-md hover:border-blue-300 transition-colors"
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <motion.button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            dragControls.start(e);
          }}
          animate={{ scale: active ? 0.9 : 1 }}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="h-4 w-4" />
        </motion.button>

        <MapPin className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">
          {dest.label}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-7 w-7 p-0 hover:bg-red-50 text-red-500"
      >
        <X className="h-4 w-4" />
      </Button>
    </Reorder.Item>
  );
}

/* ======================================================
   SHADOW ANIMATION
====================================================== */

const inactiveShadow = '0px 0px 0px rgba(0,0,0,0)';

function useRaisedShadow(value) {
  const boxShadow = useMotionValue(inactiveShadow);

  useEffect(() => {
    let isActive = false;

    return value.onChange((latest) => {
      const wasActive = isActive;
      isActive = latest !== 0;

      if (isActive !== wasActive) {
        animate(
          boxShadow,
          isActive
            ? '0px 8px 20px rgba(0,0,0,0.15)'
            : inactiveShadow,
        );
      }
    });
  }, [value, boxShadow]);

  return boxShadow;
}
