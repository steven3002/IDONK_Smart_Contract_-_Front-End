import { useEffect, useRef } from 'react';
import './create.css';
import CommunityCreate from './create';

const CreateCommunityModal = ({ closeModal }) => {

    const modalRef = useRef();

    function clickFn(e) {
        if(!modalRef.current) return;
        if(modalRef.current && !modalRef.current.contains(e.target)) { 
            closeModal(); 
        }
    };

    useEffect(() => {
        document.addEventListener("click", clickFn, true);

        return () => document.removeEventListener("click", clickFn, true);
    
    }, []);

    return (
        <div className='create__Community__Modal__Overlay'>
            <div className='create__Community__Modal' ref={modalRef}>
                <CommunityCreate closeModal={closeModal} />
            </div>
        </div>
    );
};

export default CreateCommunityModal;