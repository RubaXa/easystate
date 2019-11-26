const toString = Object.prototype.toString;

/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
export function isObject(val: any): val is object {
	return (
		(val != null)
		&& (typeof val === 'object')
		&& (Array.isArray(val) === false)
	);
}

function isObjectObject(o: any): o is object {
	return (isObject(o) === true) && (toString.call(o) === '[object Object]');
}

/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
export function isPlainObject(o: any): o is object {
	if (isObjectObject(o) === false) {
		return false;
	}

	// If has modified constructor
	const ctor = o.constructor;
	if (typeof ctor !== 'function') {
		return false;
	}

	// If has modified prototype
	const prot = ctor.prototype;
	if (isObjectObject(prot) === false) {
		return false;
	}

	// If constructor does not have an Object-specific method
	if (prot.hasOwnProperty('isPrototypeOf') === false) {
		return false;
	}

	// Most likely a plain Object
	return true;
};