import React, { useState } from 'react';
import { MapPin, Map, Navigation, Home, Briefcase } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setAddressModalOpen, addToast } from '../../store/slices/uiSlice';
import { addAddress } from '../../store/slices/authSlice';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';

export const AddressModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isAddressModalOpen);

  const [houseNo, setHouseNo] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [tag, setTag] = useState<'Home' | 'Office' | 'Other'>('Home');

  const handlePickOnMap = () => {
    // Generate realistic sample locations
    const samples = [
      { house: 'Villa 14, Prestige Lakeshore Drive', area: 'Bellandur', pin: '560103', landmark: 'Opposite Lakeside Park' },
      { house: 'Apt 204, Brigade Woods', area: 'Whitefield', pin: '560066', landmark: 'Near ITPL Gate' },
      { house: 'Flat 502, Shriram Blue', area: 'K R Puram', pin: '560036', landmark: 'Beside Hoodi Lake' },
      { house: 'Block C-903, Purva Sunflower', area: 'Rajajinagar', pin: '560010', landmark: 'Near Metro Station' }
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];
    setHouseNo(pick.house);
    setArea(pick.area);
    setPincode(pick.pin);
    setLandmark(pick.landmark);

    dispatch(addToast({
      title: 'GPS Located',
      message: 'Successfully loaded coordinates from map pin',
      type: 'success'
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (houseNo.trim() && area.trim() && pincode.trim() && landmark.trim()) {
      dispatch(
        addAddress({
          houseNo,
          area,
          pincode,
          landmark,
          tag,
        })
      );

      dispatch(
        addToast({
          title: 'Address Saved',
          message: 'Delivery location updated successfully!',
          type: 'success',
        })
      );

      handleClose();
    } else {
      dispatch(
        addToast({
          title: 'Invalid Address',
          message: 'Please fill in all address coordinates',
          type: 'error',
        })
      );
    }
  };

  const handleClose = () => {
    dispatch(setAddressModalOpen(false));
    // Clear inputs on close
    setTimeout(() => {
      setHouseNo('');
      setArea('');
      setPincode('');
      setLandmark('');
      setTag('Home');
    }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Delivery Address">
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* MAP MOCKUP */}
        <div className="relative w-full h-[160px] bg-slate-200 border border-primary-main/15 rounded-2xl overflow-hidden flex flex-col items-center justify-center shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(#a3d9a5_1px,transparent_1px)] [background-size:16px_16px] opacity-40 bg-slate-100" />
          <div className="filter grayscale opacity-25 select-none z-10">
            <Map size={48} className="text-primary-main" />
          </div>
          
          {/* Animated Pin */}
          <div className="absolute top-1/3 text-primary-main z-20 animate-bounce-slow">
            <MapPin size={38} fill="rgba(104,156,55,0.2)" />
          </div>

          <button
            type="button"
            onClick={handlePickOnMap}
            className="absolute bottom-3 bg-white hover:bg-slate-50 border border-slate-200/80 font-poppins font-bold text-[11px] text-primary-main py-2 px-5 rounded-full shadow transition-all active:scale-95 z-20 flex items-center gap-1.5"
          >
            <Navigation size={12} className="fill-current text-primary-main" /> GPS Autofill
          </button>
        </div>

        {/* Form Inputs */}
        <div className="flex flex-col gap-3.5">
          <Input
            placeholder="House / Flat / Block No."
            value={houseNo}
            onChange={(e) => setHouseNo(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Area / Street Name"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            <Input
              placeholder="Pincode"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <Input
            placeholder="Nearby Landmark"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
          />
        </div>

        {/* Tag Category Picker */}
        <div className="flex items-center justify-between border-t border-b border-slate-100 py-3.5 my-1">
          <span className="font-poppins font-bold text-xs text-slate-500">Address Category</span>
          <div className="flex gap-2">
            {(['Home', 'Office', 'Other'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={`text-xs font-poppins font-bold px-4 py-2 rounded-full border transition-all duration-300 ${
                  tag === t
                    ? 'bg-primary-main/10 border-primary-main text-primary-main shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500'
                }`}
              >
                {t === 'Home' && <Home size={12} className="inline mr-1" />}
                {t === 'Office' && <Briefcase size={12} className="inline mr-1" />}
                {t === 'Other' && <MapPin size={12} className="inline mr-1" />}
                {t}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" variant="primary" fullWidth>
          Save & Proceed to Pay
        </Button>
      </form>
    </Modal>
  );
};
