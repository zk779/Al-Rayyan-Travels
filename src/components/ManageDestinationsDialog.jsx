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
import { Calendar } from '../../shadcn/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../shadcn/components/ui/popover';
import AsyncSelect from 'react-select/async';
import { Reorder, useDragControls, useMotionValue, motion, animate } from 'motion/react';
import { MapPin, GripVertical, X, CalendarIcon, ArrowRight, Plane, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { Select } from 'antd';


const tripTypes = [
  { value: 'ONE_WAY', label: 'One Way', icon: ArrowRight },
  { value: 'ROUND_TRIP', label: 'Round Trip', icon: ArrowLeftRight },
];

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 38,
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.1)' : 'none',
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

export default function ManageDestinationsDialog({
  destinationDialog,
  setDestinationDialog,
  currentSaleForDialog,
  updateSale,
  removeDestination,
  loadDestinationOptions,
}) {
  const [tripType, setTripType] = useState('ONE_WAY');
  const [departureDate, setDepartureDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);

  useEffect(() => {
    if (currentSaleForDialog) {
      setTripType(currentSaleForDialog.tripType || 'ONE_WAY');
      setDepartureDate(currentSaleForDialog.departureDate || null);
      setReturnDate(currentSaleForDialog.returnDate || null);
    }
  }, [currentSaleForDialog]);

  const handleUpdate = (field, value) => {
    updateSale(currentSaleForDialog.id, field, value);
    if (field === 'tripType') {
      setTripType(value);
      if (value === 'ONE_WAY') {
        setReturnDate(null);
        updateSale(currentSaleForDialog.id, 'returnDate', null);
      }
    }
  };

  const addDestination = (selected) => {
    if (!selected) return;
    const existing = currentSaleForDialog.destinations || [];
    if (existing.some((d) => d.value === selected.value)) {
      alert('Destination already added!');
      return;
    }
    updateSale(currentSaleForDialog.id, 'destinations', [...existing, selected]);
  };

  const destinations = currentSaleForDialog?.destinations || [];

  return (
    <Dialog open={destinationDialog.open} onOpenChange={(open) => setDestinationDialog({ open, saleId: null })}>
      <DialogContent className="max-w-3xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-blue-600" />
            Flight Details
          </DialogTitle>
        </DialogHeader>

        {currentSaleForDialog && (
          <div className="space-y-4">
            {/* Trip Type & Dates */}
            <div className={`grid ${tripType === 'ONE_WAY' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200`}>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Trip Type</Label>

                <Select
                  size="middle"
                  value={tripType}
                  onChange={(value) => handleUpdate('tripType', value)}
                  className="w-full"
                  placeholder="Select trip type"

                  /* 🔑 THIS FIXES MOUSE CLICK */
                  getPopupContainer={(triggerNode) => triggerNode.parentElement}
                >
                  {tripTypes.map((t) => (
                    <Select.Option key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon size={14} />
                        <span>{t.label}</span>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>



              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Departure</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-[38px] text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, 'MMM dd, yyyy') : 'Select'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={(d) => { setDepartureDate(d); handleUpdate('departureDate', d); }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {tripType === 'ROUND_TRIP' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Return</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-[38px] text-sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, 'MMM dd, yyyy') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={(d) => { setReturnDate(d); handleUpdate('returnDate', d); }}
                        disabled={(date) => departureDate && date < departureDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Add Destination */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Add Destination</Label>
              <AsyncSelect
                cacheOptions
                loadOptions={loadDestinationOptions}
                value={null}
                onChange={addDestination}
                placeholder="Search airports (e.g., JED, DXB, LHR)..."
                menuPortalTarget={document.body}
                styles={selectStyles}
                noOptionsMessage={({ inputValue }) =>
                  inputValue.length < 2 ? 'Type 2+ characters' : 'No results'
                }
              />
            </div>

            {/* Destinations List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">
                  Route ({destinations.length} {destinations.length === 1 ? 'stop' : 'stops'})
                </Label>
                {destinations.length > 1 && (
                  <span className="text-xs text-slate-500">Drag to reorder</span>
                )}
              </div>

              {destinations.length > 0 ? (
                <>
                  <Reorder.Group
                    axis="y"
                    values={destinations}
                    onReorder={(newOrder) => updateSale(currentSaleForDialog.id, 'destinations', newOrder)}
                    className="space-y-2 max-h-72 overflow-y-auto p-3 bg-slate-50 rounded-lg border"
                  >
                    {destinations.map((dest, idx) => (
                      <DestinationItem
                        key={dest.value}
                        dest={dest}
                        index={idx}
                        isLast={idx === destinations.length - 1}
                        onRemove={() => removeDestination(currentSaleForDialog.id, dest.value)}
                      />
                    ))}
                  </Reorder.Group>

                  {/* Route Summary */}
                  <div className="p-2.5 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                      <Plane className="h-4 w-4" />
                      {destinations.map((d) => d.value).join(' → ')}
                      {tripType === 'ROUND_TRIP' && destinations[0] && ` → ${destinations[0].value}`}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg bg-slate-50">
                  <MapPin className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">No destinations added</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DestinationItem({ dest, index, isLast, onRemove }) {
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);

  return (
    <Reorder.Item
      value={dest}
      dragListener={false}
      dragControls={dragControls}
      style={{ y, boxShadow }}
      className="flex items-center gap-2 p-2.5 bg-white border rounded-lg hover:border-blue-400 transition-colors"
    >
      <motion.div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-grab active:cursor-grabbing text-slate-400"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="h-4 w-4" />
      </motion.div>

      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-blue-600" />
          <span className="font-semibold text-sm">{dest.value}</span>
          {index === 0 && <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">Origin</span>}
          {isLast && index > 0 && <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">Destination</span>}
        </div>
        <p className="text-xs text-slate-500">{dest.airport?.city}, {dest.airport?.country}</p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </Button>
    </Reorder.Item>
  );
}

function useRaisedShadow(value) {
  const boxShadow = useMotionValue('0px 0px 0px rgba(0,0,0,0)');

  useEffect(() => {
    let isActive = false;
    return value.onChange((latest) => {
      const wasActive = isActive;
      isActive = latest !== 0;
      if (isActive !== wasActive) {
        animate(boxShadow, isActive ? '0px 5px 15px rgba(0,0,0,0.12)' : '0px 0px 0px rgba(0,0,0,0)');
      }
    });
  }, [value, boxShadow]);

  return boxShadow;
}