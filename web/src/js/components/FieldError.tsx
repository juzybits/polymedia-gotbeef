export const FieldError: React.FC<{error: string}> = ({error}) => {
    return !error ? <></> :
    <div className='nes-text is-error' style={{fontSize: '0.85em', margin: '8px 0 0 6px' }}>{error}</div>
}
