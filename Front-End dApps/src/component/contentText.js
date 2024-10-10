import { useEffect, useRef } from "react";

const ContentText = ({ content }) => {

    const textRef = useRef();

    useEffect(() => {
        if(content && textRef.current) textRef.current.innerHTML = content;
    }, [content]);

    return (
        <div className='f-l-mid-txt' ref={textRef}></div>
    );
};

export default ContentText;