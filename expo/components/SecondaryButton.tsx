import React from 'react';
import { ActionButton, type ButtonProps } from './PrimaryButton';
export default React.memo(function SecondaryButton(props: ButtonProps) { return <ActionButton {...props} secondary />; });
