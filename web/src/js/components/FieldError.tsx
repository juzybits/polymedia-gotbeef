export function FieldError(props)
{
    return !props.error ? '' :
    <div className='nes-text is-error' style={{fontSize: '0.85em', margin: '8px 0 0 6px' }}>{props.error}</div>
}
