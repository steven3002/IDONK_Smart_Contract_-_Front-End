import { useEffect, useState } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import './styles.css';
import { COMMUNITY_PAGINATION_LENGTH } from "../config";

const Pagination = ({ loading, fullLength, indexSelected, setIndexSelected, setData, data }) => {

    const [paginationLists, setPaginationLists] = useState(['...']);

    useEffect(() => {
        if(!loading) {
            if(window.innerWidth <= 770) {
                if(fullLength <= 5) setPaginationLists(Array(fullLength - 0).fill(0).map((x, idx) => idx + 1));
                else if(indexSelected <= 3) setPaginationLists([1, 2, 3, '...', fullLength - 0]);
                else if(indexSelected >= fullLength - 3) {
                    setPaginationLists([1, '...', ...Array(3).fill(0).map((val, idx) => fullLength - 2 + idx)]);
                } else setPaginationLists([1, '...', indexSelected, '...', fullLength - 0]);
            } else {
                if(fullLength <= 8) setPaginationLists(Array(fullLength - 0).fill(0).map((x, idx) => idx + 1));
                else if(indexSelected <= 3) setPaginationLists([1, 2, 3, 4, 5, 6, '...', fullLength - 0]);
                else if(indexSelected >= fullLength - 3) {
                    setPaginationLists([1, '...', ...Array(6).fill(0).map((val, idx) => fullLength - 5 + idx)]);
                } else {
                    let start = indexSelected;
                    const res = [];
                    while(res.length < 4 && start > 3) res.push(start--);
                    res.reverse();
                    start = indexSelected + 1;
                    while(res.length < 4 && start < fullLength - 3) res.push(start++);
                    setPaginationLists([1, '...', ...res, '...', fullLength - 0]);
                }
            }

            // because indexSelected in indexed 1, but arrays are indexed 0
            const index = Math.max(0, indexSelected - 1);
            setData(data.slice(index, index + COMMUNITY_PAGINATION_LENGTH));
        }
    }, [loading, indexSelected]);

    const fireIndexFn = (index) => {
        if(index === '...') return;
        setIndexSelected(index);
    };

    const arrowFn = (type) => {
        if(type === 'L') setIndexSelected(Math.max(1, indexSelected - 1));
        else setIndexSelected(Math.min(fullLength - 0, indexSelected + 1));
    }
    
    return (
        <div className='Pagination__Wrapper'>
            <div className='pagination'>
                <div className={`pag-arrow ${indexSelected > 1 ? 'cursor' : ''}`} 
                onClick={() => arrowFn('L')}>
                    <MdKeyboardArrowLeft className="pag-icon" />
                </div>
                {paginationLists.map((val, idx) => (
                    <div className={`pag ${val === '...' ? '' : 'cursor'} ${indexSelected===val}`}
                    key={`pag-${idx}`} onClick={() => fireIndexFn(val)}>
                        {val}
                    </div>
                ))}
                <div className={`pag-arrow ${indexSelected < fullLength ? 'cursor' : ''}`} 
                onClick={() => arrowFn('R')}>
                    <MdKeyboardArrowRight className="pag-icon" />
                </div>
            </div>
        </div>
    );
};

export default Pagination;